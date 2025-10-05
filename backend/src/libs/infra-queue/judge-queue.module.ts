import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  JUDGE_QUEUE_CONSUMER_PORT,
  SUBMISSION_DISPATCHER,
} from '../../port/queue/judge-queue.port';
import {
  BullMqJudgeConsumer,
  BullMqSubmissionDispatcher,
  queueProviders,
} from './bullmq-judge-queue.adapter';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    }),
    BullModule.registerQueue({
      name: 'judge',
    }),
  ],
  providers: [BullMqSubmissionDispatcher, BullMqJudgeConsumer, ...queueProviders],
  exports: [SUBMISSION_DISPATCHER, JUDGE_QUEUE_CONSUMER_PORT],
})
export class JudgeQueueModule {}
