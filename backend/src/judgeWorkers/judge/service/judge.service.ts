import { Injectable, Logger } from '@nestjs/common';
import { JudgeTaskPayload } from '../dto/judgeTaskPlayload';
import { JudgeCommandPort } from '../../port/judge/judge-command.port';

/** bussiness logic loop to deque and write back results
 * 1.. call sandbox to run
 * 2. collect results
 * 3. read Judge-cases table
 * 4. implement scoring strategy (normal, spj, interactive)
 * 5. updating submission status（Judge table) (Judge-cases table)
*/
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
