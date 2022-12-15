import Redis from 'ioredis';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { GatewayIntentBits } from 'discord-api-types/v10';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Client, Events, Partials, TextChannel } from 'discord.js';
import { Job, Queue } from 'bullmq';

import {
  chatQueue,
  MessageJobInterface,
  MessageJobResInterface,
} from '@app/shared';

import {
  BullQueueEvents,
  BullQueueEventsListener,
  BullQueueEventsListenerArgs,
  BullQueueInject,
} from '@anchan828/nest-bullmq';


@Injectable()
@BullQueueEvents({ queueName: chatQueue.name, options: chatQueue.workerOptions })
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name, { timestamp: true });
  private client: Client;
  private channel: TextChannel;

  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
    @BullQueueInject(chatQueue.name)
    private readonly queue: Queue<MessageJobInterface, MessageJobResInterface>,
  ) {
  }

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

    await this.loadBot();

    await this.bot();

    // await this.test();
  }

  async loadBot() {
    await this.redisService.flushall();
    await this.client.login(process.env.DISCORD_TOKEN);
  }

  async bot() {
    this.client.on(Events.ClientReady, async () =>
      this.logger.log(`Logged in as ${this.client.user.tag}!`),
    );

    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.id === this.client.user.id || message.author.bot) return;

      this.logger.log(`Event: ${Events.MessageCreate} has been triggered by: ${message.id}`);

      const { id, author, channelId, content, reference } = message;

      if (message.content) await this.queue.add(
        message.id,
        { id, author, channelId, content, reference },
        { jobId: message.id }
      );
    });
  }

  @BullQueueEventsListener("completed")
  public async completed(args: BullQueueEventsListenerArgs["completed"]): Promise<void> {
    console.debug(`[${args.jobId}] completed`);


    const j = await Job.fromId(this.queue, args.jobId);
    console.log(j.returnvalue);

    try {
      this.channel = await this.client.channels.fetch(j.returnvalue.channelId) as TextChannel;

      await this.channel.send(j.returnvalue.response);
    } catch (e) {
     this.logger.log(`Unable to send message, somehow!`);
    }
  }
}
