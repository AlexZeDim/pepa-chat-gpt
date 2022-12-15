import { chatQueue } from '@app/shared';
import { BullWorker, BullWorkerProcess } from '@anchan828/nest-bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Message } from 'discord.js';

@BullWorker({ queueName: chatQueue.name, options: chatQueue.workerOptions })
export class ChatWorker {
  private readonly logger = new Logger(
    ChatWorker.name, { timestamp: true },
  );

  @BullWorkerProcess(chatQueue.workerOptions)
  public async process(job: Job<Message, void>): Promise<void> {

  }
}
