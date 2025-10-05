import { IsOptional, IsString } from 'class-validator';

export class QuizRecordQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;
}
