import { JudgeStatus } from 'src/api/modules/submission/entities/judge.entity';

/**
 * Represents the result of a single test case execution.
 */
export class JudgeCaseResultDto {
  caseId: number;
  status: JudgeStatus;
  time: number; // in ms
  memory: number; // in KB
  stdout: string | null;
  stderr: string | null;
}

/**
 * Represents the final aggregated result of a submission after all test cases have run.
 */
export class JudgeResultDto {
  status: JudgeStatus;
  time: number; // Max time of all cases
  memory: number; // Max memory of all cases
  caseResults: JudgeCaseResultDto[];
}
