import Redis from 'ioredis';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { GatewayIntentBits } from 'discord-api-types/v10';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Client, Events, Partials, TextChannel } from 'discord.js';
import { Job, Queue } from 'bullmq';
import { Configuration, OpenAIApi } from 'openai';
import { setTimeout } from 'node:timers/promises';

import {
  chatQueue,
  MessageJobInterface,
  MessageJobResInterface,
  OPENAI_MODEL_ENGINE,
} from '@app/shared';

import {
  BullQueueEvents,
  BullQueueEventsListener,
  BullQueueEventsListenerArgs,
  BullQueueInject, BullWorker,
  BullWorkerProcess,
} from '@anchan828/nest-bullmq';

@Injectable()
@BullWorker({ queueName: chatQueue.name, options: chatQueue.workerOptions })
@BullQueueEvents({ queueName: chatQueue.name, options: chatQueue.workerOptions })
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name, { timestamp: true });
  private client: Client;
  private channel: TextChannel;
  private chatConfiguration: Configuration;
  private chatEngine: OpenAIApi;
  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
    @BullQueueInject(chatQueue.name)
    private readonly queue: Queue<MessageJobInterface, MessageJobResInterface>,
  ) { }

  async onApplicationBootstrap() {
    this.client = new Client({
      partials: [Partials.User, Partials.Channel, Partials.GuildMember],
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      presence: {
        status: 'online',
      },
    });

    await this.test();

    // await this.loadBot(true);

    // await this.bot();
  }

  async test() {

  }

  async loadBot(resetContext: boolean = false) {
    if (resetContext) {
      await this.redisService.flushall();
      this.logger.warn(`resetContext set to ${resetContext}`);
    }
    await this.client.login(process.env.DISCORD_TOKEN);
  }

  async bot() {
    this.client.on(Events.ClientReady, async () =>
      this.logger.log(`Logged in as ${this.client.user.tag}!`),
    );

    /**
     * @description Doesn't trigger itself & other bots as-well.
     */
    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.id === this.client.user.id || message.author.bot) return;

      // TODO check if pepa mentioned somehow

      // TODO not every message but probability of it

      await message.channel.sendTyping();
      this.logger.log(`Event: ${Events.MessageCreate} has been triggered by: ${message.id}`);

      const { id, author, channelId, content, reference } = message;

      // TODO random key query from array;
      const token = process.env.OPENAI_API_KEY_2

      if (message.content) await this.queue.add(
        message.id,
        { id, author, channelId, token, content, reference },
        { jobId: message.id }
      );
    });
  }

  @BullWorkerProcess(chatQueue.workerOptions)
  public async process(job: Job<MessageJobInterface, MessageJobResInterface>): Promise<MessageJobResInterface> {
    try {
      this.logger.log(`Job ${job.id} has been started!`);

      const { id, author, channelId, token, content, reference } = { ...job.data };

      let dialogContext: string[] = [`${author.id}: Привет, кто ты?', 'Пепа: Привет! Я - Пепа. Я люблю играть в World of Warcraft за монаха. Ходить в ключи и лутать шмотки.`];

      let userIdOriginalPoster: string = author.id;

      if (reference) {
        /**
         * @description reference exists but no original message found
         * @description if found, we join dialog via originalPosterUserId
         */
        const originalRefMessageId = await this.redisService.get(reference.messageId);
        if (!originalRefMessageId) {
          this.logger.warn(`We have found a reference link, but seems no reference dialog. Ok, SKIP...`);
          return; // TODO MVF GOTO
        }

        this.logger.debug(`RefM: ${reference.messageId} => OriginalM: ${originalRefMessageId}`);

        const originalPosterUserId = await this.redisService.get(originalRefMessageId);
        this.logger.debug(`OriginalM: ${originalRefMessageId} => OriginalU ${originalPosterUserId}`);
        if (originalPosterUserId) {
          userIdOriginalPoster = originalPosterUserId;
        }
      }

      /**
       * @description Check is dialog with selected user already exists
       * @description If not flag, consider dialog started
       * @description anyway, refresh TTL start key
       */
      const messageContextNumber = await this.redisService.llen(userIdOriginalPoster);
      this.logger.log(`Dialog context with user: ${userIdOriginalPoster} has ${messageContextNumber} messages`);

      await this.redisService.set(id, userIdOriginalPoster, 'EX', 900);

      if (messageContextNumber) {
        if (messageContextNumber > 3) {
          await this.redisService.lpop(userIdOriginalPoster);
        }
        dialogContext = await this.redisService.lrange(userIdOriginalPoster, 0, 4);
      }

      let userPrettyText = content.replace(/\n/g, ' ').replace(/\\n/g, ' ');
      if (!userPrettyText.endsWith(".") || userPrettyText.endsWith("?") || userPrettyText.endsWith("!")) {
        userPrettyText = `${userPrettyText}.`
      }

      dialogContext.push(`${userIdOriginalPoster}: ${userPrettyText}`);

      console.log(dialogContext);

      this.channel = await this.client.channels.cache.get(channelId) as TextChannel;
      if (!this.channel) this.channel = await this.client.channels.fetch(channelId) as TextChannel;

      let chatResponses;

      try {
        this.chatConfiguration = new Configuration({ apiKey: token });

        this.chatEngine = new OpenAIApi(this.chatConfiguration);

        const { data } = await this.chatEngine.createCompletion({
          model: OPENAI_MODEL_ENGINE.ChatGPT3,
          prompt: dialogContext,
          temperature: 0.5, // 0.9
          max_tokens: 1999,
          top_p: 0.3, // 0.3 and more sarcastic
          frequency_penalty: 0.5, // 0.0
          presence_penalty: 0.0, // 0.6
          best_of: 2,
          user: userIdOriginalPoster,
          stop: [`${userIdOriginalPoster}:`],
        });

        chatResponses = data;
      } catch (chatEngineError) {
        this.logger.error(`${chatEngineError.response.status} : ${chatEngineError.response.statusText}`);
        const discordErrorMessage = await this.channel.send(`Ты оставил меня без слов!`);
        await setTimeout(15_000);
        await discordErrorMessage.delete();
        return { response: '', channelId };
      }

      this.logger.log(`Request for ${userIdOriginalPoster} has been sent & received`);
      if (!chatResponses || !chatResponses.choices || !chatResponses.choices.length) {
        const discordErrorMessage = await this.channel.send(`Ты оставил меня без слов!`);
        await setTimeout(15_000);
        await discordErrorMessage.delete();
      }
      // TODO pretty format
      let response: string;
      const responseChoice = chatResponses.choices.reduce((prev, current) => (prev.index > current.index) ? prev : current);
      const formatString = responseChoice.text.split(/:/);

      formatString.length === 1 ? response = formatString[0] : response = formatString[1];

      response
        .replace(/\n/g, '')
        .replace(/\\n/g, '');

      console.log(response);

      await this.redisService.rpush(userIdOriginalPoster, `Пепа: ${response}`);

      const messageSuccess = await this.channel.send(response);
      await setTimeout(600_000);
      await messageSuccess.delete();

      return { response, channelId };
    } catch (e) {
      console.error(e)
    }
  }

  @BullQueueEventsListener("completed")
  public async completed(args: BullQueueEventsListenerArgs["completed"]): Promise<void> {
    this.logger.log(`[${args.jobId}] completed`);
  }

  @BullQueueEventsListener("failed")
  public async failed(args: BullQueueEventsListenerArgs["failed"]): Promise<void> {
    this.logger.log(`[${args.jobId}] failed`);
  }

  @BullQueueEventsListener("progress")
  public async progress(args: BullQueueEventsListenerArgs["progress"]): Promise<void> {
    this.logger.log(`[${args.jobId}] progress`);
  }
}
