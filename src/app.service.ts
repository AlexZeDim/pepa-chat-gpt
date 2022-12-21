import Redis from 'ioredis';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { GatewayIntentBits } from 'discord-api-types/v10';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Client, Events, Partials, TextChannel } from 'discord.js';
import { Job, Queue } from 'bullmq';
import { Configuration, OpenAIApi } from 'openai';
import { Interval } from '@nestjs/schedule';
import { ChatService } from './chat/chat.service';
import { setTimeout } from 'node:timers/promises';

import {
  chatQueue,
  corpus,
  MessageJobInterface,
  MessageJobResInterface,
  OPENAI_MODEL_ENGINE,
  PEPA_CHAT_KEYS,
  PEPA_STORAGE_KEYS,
  PEPA_TRIGGER_FLAG,
  randInBetweenFloat,
  randInBetweenInt,
} from '@app/shared';

import { BullQueueInject, BullWorker, BullWorkerProcess } from '@anchan828/nest-bullmq';
import * as console from 'console';


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
      partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember
      ],
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

    await this.loadBot();

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

    await this.redisService.del(PEPA_STORAGE_KEYS.EMOJIS);
    await this.queue.obliterate();

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
        const isIgnore = await this.chatService.isIgnoreFlag();

        if (message.author.id === this.client.user.id || message.author.bot) return;

        if (message.channelId === '217532087001939969') {
          await this.chatService.updateLastActiveMessage();
        }

        const { id, author, channelId, reference } = message;

        let { content } = message;
        let isMentioned: boolean;

        if (content) {
          await this.chatService.addToContext(channelId, author.username, content);
        }

        if (isIgnore) return;

        if (message.mentions && message.mentions.users.size) {
          isMentioned = message.mentions.users.has(this.client.user.id);
          await this.redisService.set(PEPA_CHAT_KEYS.MENTIONED, 1, 'EX', randInBetweenInt(25, 70));
        }

        const wasMentioned = (!!await this.redisService.exists(PEPA_CHAT_KEYS.MENTIONED));
        if (wasMentioned) {
          isMentioned = true;
        } else {
          const regex = new RegExp('^пеп');
          isMentioned = content.split(' ').filter(Boolean).some(s => regex.test(s.toLowerCase()));
          await this.redisService.set(PEPA_CHAT_KEYS.MENTIONED, 1, 'EX', randInBetweenInt(25, 70));
        }

        const { flag } = await this.chatService.diceRollerFullHouse(!!content, !!message.attachments.size, isMentioned);

        if (flag === PEPA_TRIGGER_FLAG.EMOJI) {
          await this.chatService.chatPepeReaction(this.client, message, 0, this.storageEmojisLength);
        }

        if (flag === PEPA_TRIGGER_FLAG.MESSAGE) {
          await message.channel.sendTyping();
          await setTimeout(randInBetweenInt(1, 4) * 1000);
          await message.channel.sendTyping();

          this.logger.log(`Event: ${Events.MessageCreate} has been triggered by: ${message.id}`);
          await this.redisService.set(PEPA_CHAT_KEYS.MENTIONED, 1, 'EX', randInBetweenInt(25, 70));

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
      const isMedia = await this.chatService.getLastActiveMessage();
      // TODO add inactive interaction

      const { flag, context } = await this.chatService.diceRollerFullHouse(false, false, false, isMedia);
      if (context) {
        this.logger.debug(`Flag ${flag} triggered`);
        this.channel = await this.client.channels.cache.get('217532087001939969') as TextChannel;
        await this.channel.send(context);
      }

      if (flag === PEPA_TRIGGER_FLAG.RAID_TRIGGER_HAPPY) {
        const guild = await this.client.guilds.fetch('217529277489479681');

        let role = await guild.roles.cache.get('543816517343641621');
        if (!role) await guild.roles.fetch('543816517343641621');

        this.logger.debug(`Found ${role.members.size} raiders!`);
        if (role && role.members.size) {
          for (const [id, guildMember] of role.members.entries()) {
            if (await this.redisService.exists(PEPA_TRIGGER_FLAG.RAID_TRIGGER_HAPPY)) {
              break;
            }

            this.logger.debug(`Trying to fetch ${guildMember.user.username}`);
            const guildMemberWithPresence = await guild.members.fetch({ user: id, withPresences: true });
            if (!(guildMemberWithPresence.presence && guildMemberWithPresence.presence.activities && guildMemberWithPresence.presence.activities.length)) {
              continue;
            }
            for (const activity of guildMemberWithPresence.presence.activities) {
              this.logger.debug(`Scan ${guildMember.user.username} with activity ${activity.name}`);
              if (activity.name === 'World of Warcraft') {
                this.channel = await this.client.channels.cache.get('217532087001939969') as TextChannel;
                const raidTime = corpus.hardcore.random();
                await this.channel.send(`<@${id}> ${raidTime}`);
                await this.redisService.set(PEPA_TRIGGER_FLAG.RAID_TRIGGER_HAPPY, 1, 'EX', randInBetweenInt(1200, 3600));
                break;
              }
            }
          }
        }
      }

    } catch (e) {
      console.error(e);
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
       * @description Check is context of a channel is already presents
       * @description If not flag, consider dialog started
       * @description anyway, refresh TTL start key
       */
      const messageContextNumber = await this.redisService.llen(channelId);
      this.logger.log(`Dialog context in ${channelId} channel has ${messageContextNumber} messages`);

      if (messageContextNumber) {
        const storedContext = await this.redisService.lrange(channelId, -2, -1);
        dialogContext = [...dialogContext, ...storedContext];
      }

      this.channel = await this.client.channels.cache.get(channelId) as TextChannel;
      if (!this.channel) this.channel = await this.client.channels.fetch(channelId) as TextChannel;

      let chatResponses;

      try {
        const engineIndex = randInBetweenInt(0, 1);

        this.chatEngine = this.chatEngineStorage[engineIndex];
        this.logger.debug(`Engine ${engineIndex} selected. REQUEST =>`);
        console.log(dialogContext);

        const { data } = await this.chatEngine.createCompletion({
          model: OPENAI_MODEL_ENGINE.ChatGPT3,
          prompt: dialogContext.join('\n'),
          temperature: 0.7, // randInBetweenFloat(0.5, 0.9, 1),
          max_tokens: 2048,
          // top_p: randInBetweenFloat(0.3, 0.5, 1),
          frequency_penalty:  0.0, // randInBetweenFloat(0.3, 0.6, 1),
          presence_penalty: randInBetweenFloat(-2.0, 2.0, 1),
          best_of: 2,
        });

        chatResponses = data;
      } catch (chatEngineError) {
        this.logger.error(`${chatEngineError.response.status} : ${chatEngineError.response.statusText}`);

        const backoffReply = await this.chatService.triggerError();

        await this.channel.send(backoffReply);

        return { response: backoffReply, channelId };
      }

      if (!chatResponses || !chatResponses.choices || !chatResponses.choices.length) {
        const mediaReply = corpus.media.random();

        await this.channel.send(mediaReply);
      }

      const responseChoice = chatResponses.choices.reduce((prev, current) => (prev.index > current.index) ? prev : current);

      const pepaNaming = new RegExp('пе[а-я]*:', 'i');

      const formatString = pepaNaming.test(responseChoice.text) ? responseChoice.text.replace(pepaNaming, '').trim() : responseChoice.text.trim();

      const response = this.chatService.prepareChatText(formatString);

      /**
       * @description Stop self-learning
       * await this.redisService.rpush(channelId, `Пепа: ${response}`);
       */

      if (response) {
        await this.channel.send(response);
      }

      return { response, channelId };
    } catch (e) {
      console.error(e)
    }
  }
}
