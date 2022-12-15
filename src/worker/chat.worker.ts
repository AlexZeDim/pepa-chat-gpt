import {
  chatQueue,
  MessageJobInterface,
  MessageJobResInterface,
  OPENAI_MODEL_ENGINE,
  randInBetweenInt,
} from '@app/shared';
import { BullWorker, BullWorkerProcess } from '@anchan828/nest-bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GuildTextBasedChannel, If, Message, TextBasedChannel } from 'discord.js';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Configuration, OpenAIApi } from 'openai';

@BullWorker({ queueName: chatQueue.name, options: chatQueue.workerOptions })
export class ChatWorker {
  private readonly logger = new Logger(
    ChatWorker.name, { timestamp: true },
  );

  private chatConfiguration: Configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  private chatEngine: OpenAIApi = new OpenAIApi(this.chatConfiguration);


  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
  ) { }

  @BullWorkerProcess(chatQueue.workerOptions)
  public async process(job: Job<MessageJobInterface, MessageJobResInterface>): Promise<MessageJobResInterface> {
    const { id, author, channelId, content, reference } = { ...job.data };
    console.log(id, author, channelId, content, reference);

    // TODO cover with logger & bull log?

    let dialogContext: string[];
    let userIdOriginalPoster: string = author.id;

    if (reference) {
      const originalRefMessageId = await this.redisService.get(reference.messageId);
      if (!originalRefMessageId) {
        // TODO reference exists but no original message found
        return;
      }

      this.logger.debug(`RefM: ${reference.messageId} => OriginalM: ${originalRefMessageId}`);

      const originalPosterUserId = await this.redisService.get(originalRefMessageId);
      if (originalPosterUserId) {
        userIdOriginalPoster = originalPosterUserId;
        // TODO we join to originalPosterUserId conversation
      }

      this.logger.debug(`OriginalM: ${originalRefMessageId} => OriginalU ${originalPosterUserId}`);
    }

    /**
     * @description Check is dialog with selected user already exists
     * @description If not flag, consider dialog started
     */
    const userDialogExists = !!await this.redisService.exists(userIdOriginalPoster);

    await this.redisService.set(id, userIdOriginalPoster, 'EX', 900);
    await this.redisService.sadd(userIdOriginalPoster, `You: ${content}`);

    if (userDialogExists) {
      dialogContext = await this.redisService.smembers(userIdOriginalPoster);
      // TODO if dialog exists, remain only 2 x 2 phrases context
    }

    await this.redisService.expire(userIdOriginalPoster, 900);

    console.log(dialogContext);

    const { data } = await this.chatEngine.createCompletion({
      model: OPENAI_MODEL_ENGINE.ChatGPT3,
      prompt: dialogContext,
      temperature: 0.5,
      max_tokens: randInBetweenInt(60, 999),
      top_p: 1.0,
      frequency_penalty: 0.5,
      presence_penalty: 0.0,
      stop: ["You:"],
    });

    console.log(data.choices);

    if (!data || !data.choices || !data.choices.length) {
      // TODO apology reply
      return;
    }

    const [responseChoice] = data.choices;
    console.log(responseChoice);

    await this.redisService.sadd(userIdOriginalPoster, responseChoice.text);

    return {
      response: responseChoice.text,
      channelId,
    };
  }
}
