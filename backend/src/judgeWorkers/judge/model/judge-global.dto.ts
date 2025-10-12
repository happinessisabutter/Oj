import { JudgeMode } from 'src/api/modules/problem/entities/problem.entity';
import { JudgeCaseDto } from './judge-case.dto';

/**
 * This DTO encapsulates all configuration and data needed for a complete judging process.
 * It is created by the JudgeRunner and passed to the judging strategies.
 */
export interface JudgeGlobalDto {
  // Core submission info
  submissionId: number;
  problemId: number;
  
  // Judge mode and code
  judgeMode: JudgeMode;
  userCode: string;
  language: string;

  // Problem constraints
  maxTime: number; // in ms
  maxMemory: number; // in KB

  // Test case data
  testCases: JudgeCaseDto[];

  // SPJ / Interactive specific
  spjCode?: string;
  spjLanguage?: string;
}
