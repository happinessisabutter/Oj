import { JudgeStatus } from 'src/api/modules/submission/entities/judge.entity';

export class SandboxResultDto {
  status: JudgeStatus;
  /**the status char of the sandbox */
  originalStatus: string;
  /** the exit code of the sandbox process */
  exitCode: number | null;
  stdout: string | null;
  stderr: string | null;
  time: number | null; // in seconds
  memory: number | null; // in KB
  message: string | null;
}