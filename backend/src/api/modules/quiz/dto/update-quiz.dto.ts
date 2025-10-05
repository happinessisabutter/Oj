import { PartialType } from '@nestjs/mapped-types';
import { CreateQuizDto } from './create-quiz.dto';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';

class QuizProblemInputDto {
  @Type(() => Number)
  @IsPositive()
  quizProblemId!: number;

  @IsOptional()
  @IsString()
  displayId?: string;
}

export class UpdateQuizDto extends PartialType(CreateQuizDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizProblemInputDto)
  problems?: QuizProblemInputDto[];
}
