import { JobsOptions } from 'bullmq';
import { QueueInterface } from '@app/shared/interface';

const queueOptions: JobsOptions = {
  removeOnComplete: 10,
  removeOnFail: 10,
};

export const chatQueue: QueueInterface = {
  name: 'ORA:chat',
  workerOptions: {
    concurrency: 1,
    limiter: {
      duration: 6000,
      max: 2
    }
  },
  options: {
    defaultJobOptions: queueOptions,
  },
}
