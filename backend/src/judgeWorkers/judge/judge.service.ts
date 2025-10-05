import { Injectable, Logger } from '@nestjs/common';
import { JudgeTaskPayload } from './judge.types';
import { JudgeCommandPort } from '../../port/judge/judge-command.port';

@Injectable()
export class JudgeService implements JudgeCommandPort {
  private readonly logger = new Logger(JudgeService.name);

  async process(payload: JudgeTaskPayload): Promise<void> {
    this.logger.debug(
      `JudgeService.process submission=${payload.submissionId}`,
    );
    // TODO: fetch submission + problem details, compile/run in sandbox, write results back
  }
}
