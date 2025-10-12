/**
 * use problem id find cases
 */
export interface JudgeTaskPayload {
  submissionId: number;
  problemId: string;
  language: string;
  code: string;
}
