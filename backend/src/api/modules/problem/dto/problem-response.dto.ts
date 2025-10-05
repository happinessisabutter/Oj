import { Expose, Type } from 'class-transformer';

export class ProblemCaseMetaDto {
  @Expose()
  id!: number;

  @Expose()
  status!: string;
}

export class ProblemSummaryDto {
  @Expose()
  id!: number;

  @Expose()
  problemId!: string;

  @Expose()
  title!: string;

  @Expose()
  difficulty!: number;

  @Expose()
  tags!: string[];

  @Expose()
  updatedAt!: Date;
}

export class ProblemDetailDto extends ProblemSummaryDto {
  @Expose()
  author!: string | null;

  @Expose()
  stem!: string;

  @Expose()
  input!: string;

  @Expose()
  output!: string;

  @Expose()
  example!: string;

  @Expose()
  source!: string;

  @Expose()
  timeLimit!: number | null;

  @Expose()
  memoryLimit!: number | null;

  @Expose()
  stackLimit!: number;

  @Expose()
  @Type(() => ProblemCaseMetaDto)
  cases!: ProblemCaseMetaDto[];
}
