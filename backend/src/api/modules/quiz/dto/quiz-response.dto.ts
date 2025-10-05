import { Expose, Type } from 'class-transformer';

export class QuizCategoryDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;
}

export class QuizSummaryDto {
  @Expose()
  id!: number;

  @Expose()
  title!: string;

  @Expose()
  status!: boolean;

  @Expose()
  rank!: number;

  @Expose()
  category?: QuizCategoryDto | null;
}

export class QuizProblemSummaryDto {
  @Expose()
  id!: number;

  @Expose()
  displayId!: string;

  @Expose()
  problemId!: number;

  @Expose()
  problemTitle!: string;
}

export class QuizRegistrationDto {
  @Expose()
  id!: number;

  @Expose()
  userId!: string;

  @Expose()
  username!: string;
}

export class QuizDetailDto extends QuizSummaryDto {
  @Expose()
  description!: string | null;

  @Expose()
  author!: string;

  @Expose()
  @Type(() => QuizProblemSummaryDto)
  problems!: QuizProblemSummaryDto[];

  @Expose()
  @Type(() => QuizRegistrationDto)
  registrations!: QuizRegistrationDto[];
}

export class QuizRecordDto {
  @Expose()
  id!: number;

  @Expose()
  problemId!: number;

  @Expose()
  userId!: string;

  @Expose()
  submitId!: number | null;

  @Expose()
  updatedAt!: Date;
}
