import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  JUDGE_QUEUE_CONSUMER_PORT,
  SUBMISSION_DISPATCHER,
} from '../../common/port/queue/judge-queue.port';
import {
  bullmqJudgeConsumer,
  bullmqJudgeQueueProviders,
  bullmqSubmissionDispatcher
} from './bullmq-judge-queue.adapter';

/** Judge queue module
 * modified mq provider here
 */
@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
    }),
    BullModule.registerQueue({
      name: 'judge',
    }),
  ],
  providers: [
    bullmqSubmissionDispatcher,
    bullmqJudgeConsumer,
    ...bullmqJudgeQueueProviders 
  ],
  exports: [SUBMISSION_DISPATCHER, JUDGE_QUEUE_CONSUMER_PORT],
})
export class JudgeQueueModule {}
