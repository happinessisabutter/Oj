import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginateDto } from 'src/common/dto/paginate.dto';
import { JudgeStatus } from '../entities/judge.entity';

export class SubmissionListQueryDto extends PaginateDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  problemId?: number;

  @IsOptional()
  @IsString()
  displayProblemId?: string;

  @IsOptional()
  @IsEnum(JudgeStatus)
  status?: JudgeStatus;
}
