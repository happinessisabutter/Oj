import { Expose, Type } from 'class-transformer';

export class ScoreboardColumnDto {
  @Expose()
  displayId!: string;

  @Expose()
  problemId!: number;

  @Expose()
  title!: string;
}

export class ScoreboardCellDto {
  @Expose()
  problemId!: number;

  @Expose()
  status!: 'accepted' | 'failed' | 'none';

  @Expose()
  submitId!: number | null;

  @Expose()
  updatedAt!: Date | null;

  @Expose()
  @Type(() => ScoreboardCaseStatusDto)
  cases?: ScoreboardCaseStatusDto[];
}

export class ScoreboardRowDto {
  @Expose()
  userId!: string;

  @Expose()
  username!: string;

  @Expose()
  solved!: number;

  @Expose()
  correctRate!: number;

  @Expose()
  attempts!: number;

  @Expose()
  lastUpdated!: Date | null;

  @Expose()
  @Type(() => ScoreboardCellDto)
  cells!: ScoreboardCellDto[];
}

export class ScoreboardDto {
  @Expose()
  @Type(() => ScoreboardColumnDto)
  columns!: ScoreboardColumnDto[];

  @Expose()
  @Type(() => ScoreboardRowDto)
  rows!: ScoreboardRowDto[];
}

export class ScoreboardCaseStatusDto {
  @Expose()
  caseId!: string;

  @Expose()
  status!: string;
}
