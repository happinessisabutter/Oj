import { Expose, Type } from 'class-transformer';

/** Summary of a user's progress for a single problem. */
export class ProblemProgressDto {
  @Expose()
  problemId!: number;

  @Expose()
  displayProblemId!: string;

  @Expose()
  title!: string;

  @Expose()
  solved!: boolean;

  @Expose()
  attempts!: number;

  @Expose()
  lastStatus!: number;

  @Expose()
  lastSubmitId!: number | null;

  @Expose()
  lastUpdated!: Date | null;
}

/** Entry describing a single submission attempt within the user's history. */
export class ProblemSubmissionHistoryDto {
  @Expose()
  submitId!: number;

  @Expose()
  status!: number;

  @Expose()
  errorMessage!: string | null;

  @Expose()
  language!: string;

  @Expose()
  time!: number | null;

  @Expose()
  memory!: number | null;

  @Expose()
  submitTime!: Date;
}

/** Wrapper for the history list. */
export class ProblemSubmissionHistoryResponseDto {
  @Expose()
  displayProblemId!: string;

  @Expose()
  title!: string;

  @Expose()
  @Type(() => ProblemSubmissionHistoryDto)
  submissions!: ProblemSubmissionHistoryDto[];
}
