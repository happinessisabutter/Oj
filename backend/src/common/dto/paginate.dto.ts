import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * @description dto of pagination
 * @param page - page number
 * @param pageSize - page size
 */
export class PaginateDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(20)
  pageSize: number = 20;
}
/**
 * @description dto of common list query
 * @param search - search keyword
 * @param order - order by
 */
export class CommonListQueryDto extends PaginateDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder.DESC;
}
