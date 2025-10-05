import { Type } from 'class-transformer';
import {
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateQuizRecordDto {
  @Type(() => Number)
  @IsPositive()
  quizProblemId!: number;

  @Type(() => Number)
  @IsPositive()
  problemId!: number;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  submissionId?: number;
}
