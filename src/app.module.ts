import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@anchan828/nest-bullmq';
import { chatQueue } from '@app/shared';
import { ChatWorker } from './worker/chat.worker';

@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.forRoot({
      options: {
        connection: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT, 10),
          password: process.env.REDIS_PASSWORD,
        },
      },
    }),
    BullModule.registerQueue({ queueName: chatQueue.name, options: chatQueue.options }),
  ],
  controllers: [],
  providers: [AppService, ChatWorker],
})
export class AppModule {}
