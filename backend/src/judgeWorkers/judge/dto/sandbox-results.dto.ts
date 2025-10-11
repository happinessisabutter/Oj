import { JudgeStatus } from 'src/api/modules/submission/entities/judge.entity';

export class SandboxResultDto {
  status: JudgeStatus;
  stdout: string | null;
  stderr: string | null;
  time: number | null; // in seconds
  memory: number | null; // in KB
  message: string | null;
}