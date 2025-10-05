import { Inject, Injectable, Logger } from '@nestjs/common';
import { JUDGE_QUEUE_CONSUMER_PORT } from '../../port/queue/judge-queue.port';
import type { JudgeQueueConsumerPort } from '../../port/queue/judge-queue.port';
import { JUDGE_COMMAND_PORT } from '../../port/judge/judge-command.port';
import type { JudgeCommandPort } from '../../port/judge/judge-command.port';
import { JudgeTaskPayload } from './judge.types';

@Injectable()
export class JudgeLoop {
  private readonly logger = new Logger(JudgeLoop.name);
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

    await this.queueConsumer.start(async (payload: JudgeTaskPayload) => {
      try {
        await this.judgeCommand.process(payload);
        this.logger.log(`Submission ${payload.submissionId} judged`);
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Judge job ${payload.submissionId} failed`,
          err?.stack,
        );
      }
    });

    this.started = true;
    this.logger.log('Judge loop started');
  }

  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    await this.queueConsumer.stop();
    this.started = false;
  }
}
