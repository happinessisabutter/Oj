import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import type { Job } from 'bullmq';
import * as path from 'path';
import { promises as fs } from 'fs';
import {
  JUDGE_QUEUE_CONSUMER_PORT,
  JudgeQueueConsumerPort,
  JudgeQueueHandler,
  SUBMISSION_DISPATCHER,//producer
  SubmissionDispatcherPort,
} from './judge-queue.port';
import { JudgeTaskPayload } from '../../judgeWorkers/judge/dto/judgeTaskPlayload';

const QUEUE_NAME = 'judge';
const JOB_NAME = 'dispatch-judge-task';
const LOG_FILE = 'judge-queue-errors.log';

@Injectable()
export class bullmqSubmissionDispatcher implements SubmissionDispatcherPort {
  private readonly logger = new Logger(bullmqSubmissionDispatcher.name);

  constructor(@InjectQueue(QUEUE_NAME) private readonly queue: Queue<JudgeTaskPayload>) {}

  async dispatch(payload: JudgeTaskPayload): Promise<void> {
    await this.queue.add(JOB_NAME, payload, {
      removeOnComplete: true,
      attempts: 1,
    });
    this.logger.log(`Queued submission ${payload.submissionId}`);
  }
}
/**
 * @description BullMQ-based implementation of the JudgeQueueConsumerPort.
 * manages ack/fail, retries,
 * backoff, concurrency, rate limiting, progress events, etc.
 */
@Injectable()
export class bullmqJudgeConsumer implements JudgeQueueConsumerPort {
  private readonly logger = new Logger(bullmqJudgeConsumer.name);
  private worker?: Worker<JudgeTaskPayload>;

  constructor(@InjectQueue(QUEUE_NAME) private readonly queue: Queue<JudgeTaskPayload>) {}

  async start(handler: JudgeQueueHandler): Promise<void> {
    if (this.worker) {
      this.logger.log('Judge worker already started');
      return;
    }

    const connection = this.queue.opts.connection;
    this.worker = new Worker<JudgeTaskPayload>(
      QUEUE_NAME,
      async (job: Job<JudgeTaskPayload>) => {
        await handler(job.data);
      },
      { connection },
    );

    this.worker.on('completed', (job: Job<JudgeTaskPayload>) => {
      this.logger.log(`Judge job ${job.id} completed`);
    });

    this.worker.on('failed', async (job: Job<JudgeTaskPayload> | undefined, err: Error) => {
      const message = `Judge job ${job?.id ?? 'unknown'} failed: ${err?.message ?? 'unknown error'}`;
      this.logger.error(message);
      //await this.persistFailureLog(message, err?.stack);
    });
  }

  async stop(): Promise<void> {
    if (!this.worker) {
      return;
    }

    await this.worker.close();
    this.worker = undefined;
    this.logger.log('Judge worker stopped');
  }

  /**
   * Persists the failure log for a judge job.
   * @param message The error message to log.
   * @param stack The error stack trace to log.
   * @returns A promise that resolves when the log has been persisted.
   */
  private async persistFailureLog(message: string, stack?: string): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      // Skip file logging in automated tests to avoid brittle assertions.
      return;
    }

    try {
      const logsDir = path.join(process.cwd(), 'logs');
      await fs.mkdir(logsDir, { recursive: true });
      const logLine = `${new Date().toISOString()} ${message}${stack ? `\n${stack}` : ''}\n`;
      await fs.appendFile(path.join(logsDir, LOG_FILE), logLine, { encoding: 'utf8' });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to persist judge queue error log: ${err?.message ?? 'unknown error'}`);
    }
  }
}

export const bullmqJudgeQueueProviders = [
  { provide: SUBMISSION_DISPATCHER, useExisting: bullmqSubmissionDispatcher },
  { provide: JUDGE_QUEUE_CONSUMER_PORT, useExisting: bullmqJudgeConsumer },
];
