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
  chatQueue, corpus,
  MessageJobInterface,
  MessageJobResInterface,
  OPENAI_MODEL_ENGINE, PEPA_CHAT_KEYS,
  PEPA_STORAGE_KEYS,
  PEPA_TRIGGER_FLAG,
  randInBetweenFloat,
  randInBetweenInt,
} from '@app/shared';

import {
  BullQueueInject,
  BullWorker,
  BullWorkerProcess,
} from '@anchan828/nest-bullmq';
import * as console from 'console';
import { ChatEngine } from './chat/chat.engine';


@Injectable()
@BullWorker({ queueName: chatQueue.name, options: chatQueue.workerOptions })
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name, { timestamp: true });
  private client: Client;
  private channel: TextChannel;
  private chatConfiguration: [Configuration, Configuration];
  private chatEngineStorage: [OpenAIApi, OpenAIApi];
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

    this.chatConfiguration = [
      new Configuration({ apiKey: process.env.OPENAI_API_KEY_1 }),
      new Configuration({ apiKey: process.env.OPENAI_API_KEY_2 })
    ];

    const [ config1, config2 ] = this.chatConfiguration;

    this.chatEngineStorage = [
      new OpenAIApi(config1),
      new OpenAIApi(config2),
    ];
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
        const ignoreMe = (!!await this.redisService.exists(PEPA_CHAT_KEYS.FULL_TILT_IGNORE));

        if (message.author.id === this.client.user.id || message.author.bot || ignoreMe) return;

        let content = message.content;
        let isMentioned: boolean;

        const regex = new RegExp('^пеп');

        const wasMentioned = (!!await this.redisService.exists(PEPA_CHAT_KEYS.MENTIONED));
        if (wasMentioned) {
          isMentioned = true;
        } else {
          isMentioned = content.split(' ').filter(Boolean).some(s => regex.test(s.toLowerCase()));
          await this.redisService.set(PEPA_CHAT_KEYS.MENTIONED, 1, 'EX', randInBetweenInt(25, 70));
        }

        const { flag } = await this.chatService.diceRollerFullHouse(!!content, !!message.attachments.size, isMentioned);

        if (flag === PEPA_TRIGGER_FLAG.EMOJI) {
          await this.chatService.chatPepeReaction(this.client, message, 0, this.storageEmojisLength);
        }

        if (flag === PEPA_TRIGGER_FLAG.MESSAGE) {
          await message.channel.sendTyping();
          this.logger.log(`Event: ${Events.MessageCreate} has been triggered by: ${message.id}`);
          await this.redisService.set(PEPA_CHAT_KEYS.MENTIONED, 1, 'EX', randInBetweenInt(25, 70));

          const { id, author, channelId, reference } = message;

          await this.queue.add(message.id, { id, author, channelId, content, reference });
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
      const { flag, context } = await this.chatService.diceRollerFullHouse(false, false, false);
      // TODO react!
      if (context) {
        this.channel = await this.client.channels.cache.get('1051512756664279092') as TextChannel;
        await this.channel.send(context);
      }

    } catch (e) {
      console.error(e)
    }
  }

  @BullWorkerProcess(chatQueue.workerOptions)
  public async process(job: Job<MessageJobInterface, MessageJobResInterface>): Promise<MessageJobResInterface> {
    try {
      this.logger.log(`Job ${job.id} has been started!`);

      const { id, author, channelId, content, reference } = { ...job.data };

      let dialogContext = this.chatService.whoAmIContext(author.username);

      let userName: string = author.username;

      if (reference) {
        /**
         * @description reference exists but no original message found
         * @description if found, we join dialog via originalPosterUserId
         */
        const originalRefMessageId = await this.redisService.get(reference.messageId);
        if (!originalRefMessageId) {
          this.logger.warn(`We have found a reference link, but seems no reference dialog. Ok, SKIP...`);
          // TODO add ref to context
        }
      }

      /**
       * @description Check is dialog with selected user already exists
       * @description If not flag, consider dialog started
       * @description anyway, refresh TTL start key
       */
      const messageContextNumber = await this.redisService.llen(userName);
      this.logger.log(`Dialog context with user: ${userName} has ${messageContextNumber} messages`);

      await this.redisService.set(id, userName, 'EX', 900);

      if (messageContextNumber) {
        if (messageContextNumber > 4) {
          await this.redisService.lpop(userName);
        }

        const storedContext = await this.redisService.lrange(userName, 0, 4);
        dialogContext = [...storedContext];
      }

      dialogContext.push(`${userName}: ${this.chatService.prepareChatText(content)}`);

      this.channel = await this.client.channels.cache.get(channelId) as TextChannel;
      if (!this.channel) this.channel = await this.client.channels.fetch(channelId) as TextChannel;

      let chatResponses;

      try {
        const engineIndex = randInBetweenInt(0, 1);

        this.chatEngine = this.chatEngineStorage[engineIndex];
        console.log(engineIndex, dialogContext);

        const { data } = await this.chatEngine.createCompletion({
          model: OPENAI_MODEL_ENGINE.ChatGPT3,
          prompt: dialogContext,
          temperature: randInBetweenFloat(0.5, 0.9, 1),
          max_tokens: 1999,
          top_p: randInBetweenFloat(0.3, 0.5, 1), // 0.3 and more sarcastic
          frequency_penalty: randInBetweenFloat(0.3, 0.6, 1), // 0.0
          presence_penalty: randInBetweenFloat(0.0, 0.6, 1),
          best_of: 2,
          user: author.id,
          stop: [`${userName}:`],
        });

        chatResponses = data;
      } catch (chatEngineError) {

        this.logger.error(`${chatEngineError.response.status} : ${chatEngineError.response.statusText}`);

        const backoffReply = corpus.backoff.random();

        await this.channel.send(backoffReply);
        await this.redisService.set(
          PEPA_CHAT_KEYS.FULL_TILT_IGNORE, 1, 'EX', randInBetweenInt(30, 600)
        );

        return { response: backoffReply, channelId };
      }

      if (!chatResponses || !chatResponses.choices || !chatResponses.choices.length) {
        const mediaReply = corpus.media.random();

        await this.channel.send(mediaReply);
      }
      // TODO pretty format
      let response: string;
      const responseChoice = chatResponses.choices.reduce((prev, current) => (prev.index > current.index) ? prev : current);
      const formatString = responseChoice.text.split(/а:/);

      formatString.length === 1 ? response = formatString[0] : response = formatString[1];

      response = this.chatService.prepareChatText(response);

      await this.redisService.rpush(userName, `Пепа: ${response}`);

      if (response) {
        await this.channel.send(response);
      }

      return { response, channelId };
    } catch (e) {
      console.error(e)
    }
  }
}
