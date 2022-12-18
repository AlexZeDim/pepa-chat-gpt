import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@anchan828/nest-bullmq';
import { chatQueue } from '@app/shared';
import { ChatService } from './chat/chat.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
  providers: [AppService, ChatService],
})
export class AppModule {}
