/**
 * This DTO encapsulates all information for a single test case during the judging process.
 */
export interface JudgeCaseDto {
  caseId: number;
  input: string;
  expectedOutput: string;
}