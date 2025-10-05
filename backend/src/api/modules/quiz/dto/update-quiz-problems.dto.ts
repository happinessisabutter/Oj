import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsString } from 'class-validator';

export class AttachQuizProblemsDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => AttachQuizProblemItem)
  items!: AttachQuizProblemItem[];
}

export class AttachQuizProblemItem {
  @Type(() => Number)
  @IsInt()
  problemId!: number;

  @IsString()
  displayId!: string;
}

export class DetachQuizProblemsDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  quizProblemIds!: number[];
}

export class UpdateQuizProblemDisplayDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => QuizProblemDisplayItem)
  items!: QuizProblemDisplayItem[];
}

export class QuizProblemDisplayItem {
  @Type(() => Number)
  @IsInt()
  quizProblemId!: number;

  @IsString()
  displayId!: string;
}
