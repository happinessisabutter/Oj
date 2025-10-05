import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateSubmissionDto {
  @Type(() => Number)
  @IsInt()
  problemId!: number;

  @IsOptional()
  @IsString()
  displayProblemId?: string;

  @IsString()
  @MinLength(1)
  language!: string;

  @IsString()
  @MinLength(1)
  code!: string;

  @IsUUID()
  userId!: string;

  @IsString()
  username!: string;

  @IsOptional()
  @IsString()
  ip?: string;
}
