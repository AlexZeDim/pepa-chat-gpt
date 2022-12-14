import { JobsOptions } from 'bullmq';
import { QueueInterface } from '@app/shared/interface';

const queueOptions: JobsOptions = {
  removeOnComplete: 10,
  removeOnFail: 10,
};

export const chatQueue: QueueInterface = {
  name: 'ORA:chat',
  workerOptions: {
    concurrency: 5,
    limiter: {
      max: 5,
      duration: 1000,
    }
  },
  options: {
    defaultJobOptions: queueOptions,
  },
}
