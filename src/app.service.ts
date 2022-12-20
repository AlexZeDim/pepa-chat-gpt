import Redis from 'ioredis';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { GatewayIntentBits } from 'discord-api-types/v10';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Client, Events, Partials, TextChannel } from 'discord.js';
import { Job, Queue } from 'bullmq';
import { Configuration, OpenAIApi } from 'openai';
import { setTimeout } from 'node:timers/promises';
import { Interval } from '@nestjs/schedule';
import { ChatService } from './chat/chat.service';

import {
  chatQueue,
  MessageJobInterface,
  MessageJobResInterface,
  OPENAI_MODEL_ENGINE,
  PEPA_STORAGE_KEYS,
  PEPA_TRIGGER_FLAG,
} from '@app/shared';

import {
  BullQueueInject,
  BullWorker,
  BullWorkerProcess,
} from '@anchan828/nest-bullmq';
import * as console from 'console';


@Injectable()
@BullWorker({ queueName: chatQueue.name, options: chatQueue.workerOptions })
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name, { timestamp: true });
  private client: Client;
  private channel: TextChannel;
  private chatConfiguration: Configuration;
  private chatEngine: OpenAIApi;
  private storageEmojisLength: number;
  constructor(
    private chatService: ChatService,
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
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
      ],
      presence: {
        status: 'online',
      },
    });

    await this.loadBot(true);

    await this.bot();

    await this.test();
  }


  private async test() {
    // await this.chatService.test();

    // TODO
    // const dayjsLocal = dayjs();
    // console.log(dayjsLocal.hour(), dayjsLocal.minute(), dayjsLocal.weekday());

    // if (dayjsLocal.weekday() === 6) {
      // TODO wednesday
      //    10:10 open
      //    11:00 did you loot any good loot?
      //    20:00 raid time din-din-din

      // TODO check presence

      // TODO среда четверг понедельник вторник 20:00 raid time din-din-din

      // TODO tuesday 22:00 20-key-push


    // }


    /*
    await setTimeout(10_000);
    const guild = await this.client.guilds.fetch('217529277489479681');
    const nims = await guild.members.fetch({ user: '176208064217743361', withPresences: true, force: true });
    console.log(nims.presence)*/
  }


  private async loadBot(resetContext: boolean = false) {
    if (resetContext) {
      await this.redisService.flushall();
      this.logger.warn(`resetContext set to ${resetContext}`);
    }

    this.chatService.initDayJs();

    await this.client.login(process.env.DISCORD_TOKEN);
  }

  private async storage() {
    const guild = await this.client.guilds.fetch('217529277489479681');

    for (const emoji of guild.emojis.cache.values()) {
      if (emoji.name.toLowerCase().includes('pep')) {
        await this.redisService.rpush(PEPA_STORAGE_KEYS.EMOJIS, emoji.id);
        this.logger.log(`Add ${emoji.name} emoji to storage`);
      }
    }

    this.storageEmojisLength = await this.redisService.llen(PEPA_STORAGE_KEYS.EMOJIS);
    this.logger.log(`Inserted ${this.storageEmojisLength} pepe emoji!`);
  }

  private async bot() {
    this.client.on(Events.ClientReady, async () => {
        this.logger.log(`Logged in as ${this.client.user.tag}!`);
        await this.storage();
      }
    );

    /**
     * @description Doesn't trigger itself & other bots as-well.
     */
    this.client.on(Events.MessageCreate, async (message) => {
      try {
        if (message.author.id === this.client.user.id || message.author.bot) return;

        let content = message.content;

        const regex = new RegExp('^пеп');
        // TODO check before was isMentioned active for some time for dialog via redis
        const isMentioned = content.split(' ').filter(Boolean).some(s => regex.test(s.toLowerCase()));

        console.log(!!content, !!message.attachments.size, isMentioned);
        const { flag } = await this.chatService.diceRollerFullHouse(!!content, !!message.attachments.size, isMentioned);
        console.log(flag);

        if (flag === PEPA_TRIGGER_FLAG.EMOJI) {
          await this.chatService.chatPepeReaction(this.client, message, 0, this.storageEmojisLength);
        }

        if (flag === PEPA_TRIGGER_FLAG.MESSAGE) {
          await message.channel.sendTyping();
          this.logger.log(`Event: ${Events.MessageCreate} has been triggered by: ${message.id}`);

          const { id, author, channelId, reference } = message;

          const token = process.env.OPENAI_API_KEY_2

          await this.queue.add(message.id, { id, author, channelId, token, content, reference });
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  @Interval(60_000)
  async idleReaction() {
    try {
      // TODO happy raiding!

      // TODO add inactive
      this.channel = await this.client.channels.cache.get('1051512756664279092') as TextChannel;

      const { flag, context } = await this.chatService.diceRollerFullHouse(false, false, false, true);
      // TODO react!
      await this.channel.send(context);
    } catch (e) {
      console.error(e)
    }
  }

  @BullWorkerProcess(chatQueue.workerOptions)
  public async process(job: Job<MessageJobInterface, MessageJobResInterface>): Promise<MessageJobResInterface> {
    try {
      this.logger.log(`Job ${job.id} has been started!`);

      const { id, author, channelId, token, content, reference } = { ...job.data };

      let dialogContext = this.chatService.whoAmIContext(author.username);

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

      return { response, channelId };
    } catch (e) {
      console.error(e)
    }
  }
}
