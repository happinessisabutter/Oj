import { Inject, Injectable, Logger } from '@nestjs/common';
import { JUDGE_QUEUE_CONSUMER_PORT } from '../../libs/infra-queue/judge-queue.port';
import type { JudgeQueueConsumerPort } from '../../libs/infra-queue/judge-queue.port';
import { JUDGE_COMMAND_PORT } from '../port/judge-command.port';
import type { JudgeCommandPort } from '../port/judge-command.port';
import { JudgeTaskPayload } from '../judge/model/judgeTaskPlayload';

/**
 * judge abstration class
 */
@Injectable()
export class JudgeRunner {
  private readonly logger = new Logger(JudgeRunner.name);
  private started = false;

  constructor(
    @Inject(JUDGE_QUEUE_CONSUMER_PORT)
    private readonly queueConsumer: JudgeQueueConsumerPort,
    @Inject(JUDGE_COMMAND_PORT)
    private readonly judgeCommand: JudgeCommandPort,
  ) {}

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    try {
      // Start consuming from the queue
      await this.queueConsumer.start(async (payload: JudgeTaskPayload) => {
        try {
          this.logger.debug(`Received task ${payload.submissionId}`);
          await this.judgeCommand.process(payload);
          this.logger.log(`Submission ${payload.submissionId} judged`);
        } catch (error) {
          const err = error as Error;
          this.logger.error(
            `Judge job ${payload.submissionId} failed during processing`,
            err?.stack,
          );
          // Consider re-queueing the message or sending it to a dead-letter queue
          // depending on your error handling strategy.
        }
      });

      this.started = true;
      this.logger.log('Judge loop started');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to start queue consumer`, err?.stack);
      // Handle the error appropriately, e.g., retry starting the consumer,
      // exit the process, or notify an administrator.
      this.started = false; // Ensure started is set to false in case of failure
    }
  }

  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    try {
      await this.queueConsumer.stop();
      this.started = false;
      this.logger.log('Judge loop stopped');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to stop queue consumer`, err?.stack);
      // Handle the error appropriately.
    }
  }
}
