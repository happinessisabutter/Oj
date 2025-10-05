import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProblemDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'problemId must contain only alphanumeric characters, hyphen or underscore',
  })
  @MinLength(2)
  @MaxLength(32)
  problemId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  author?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  timeLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  memoryLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  stackLimit?: number;

  @IsString()
  @MinLength(1)
  stem!: string;

  @IsString()
  @MinLength(1)
  input!: string;

  @IsString()
  @MinLength(1)
  output!: string;

  @IsString()
  @MinLength(1)
  example!: string;

  @IsOptional()
  @IsString()
  source?: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(10)
  difficulty!: number;

  @IsOptional()
  @IsString()
  spiCode?: string;

  @IsOptional()
  @IsString()
  spiLanguage?: string;

  @IsOptional()
  @IsString()
  userExtraFile?: string;

  @IsOptional()
  @IsString()
  judgeExtraFile?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRemoveEndBlank?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  openCaseResult?: boolean;

  @IsOptional()
  @IsString()
  caseVersion?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isUploadCase?: boolean;
}
