 import { get } from 'http';
import { JudgeStatus } from 'src/api/modules/submission/entities/judge.entity';

/**
 * convert Judge0 to internal data structure
 * see https://ce.judge0.com/#/resources/submissions
 * see https://ce.judge0.com/#/resources/statuses
 * see https://ce.judge0.com/#/resources/languages
 *
 * Note: we don't use all the status codes from Judge0, only those relevant to our system.
 * We map multiple Judge0 statuses to our internal statuses where appropriate.
*/
export const verdictMap: Record<number, JudgeStatus> = {
  1: JudgeStatus.STATUS_PENDING, // In Queue
  2: JudgeStatus.STATUS_JUDGING, // Processing
  3: JudgeStatus.STATUS_ACCEPTED, // Accepted
  4: JudgeStatus.STATUS_WRONG_ANSWER, // Wrong Answer
  5: JudgeStatus.STATUS_CPU_TIME_LIMIT_EXCEEDED, // Time Limit Exceeded
  6: JudgeStatus.STATUS_COMPILE_ERROR, // Compilation Error
  7: JudgeStatus.STATUS_RUNTIME_ERROR, // Runtime Error (SIGSEGV)
  8: JudgeStatus.STATUS_RUNTIME_ERROR, // Runtime Error (SIGXFSZ)
  9: JudgeStatus.STATUS_RUNTIME_ERROR, // Runtime Error (SIGFPE)
  10: JudgeStatus.STATUS_RUNTIME_ERROR, // Runtime Error (SIGABRT)
  11: JudgeStatus.STATUS_RUNTIME_ERROR, // Runtime Error (NZEC)
  12: JudgeStatus.STATUS_RUNTIME_ERROR, // Runtime Error (Other)
  13: JudgeStatus.STATUS_SYSTEM_ERROR, // Internal Error
  14: JudgeStatus.STATUS_SYSTEM_ERROR, // Exec Format Error
};

export const enum judgeMode {
  TEST = 'test',
  DEFAULT = 'default',
  SPJ = 'spj',
  INTERACTIVE = 'interactive',
}

export const enum judgeDir {
  PROBLEM = 'problem',
}