import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

/** DTO describing an attach request by existing tag identifiers. */
export class AttachProblemTagsDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  tagIds!: number[];
}

/** DTO describing a detach request by tag identifiers. */
export class DetachProblemTagsDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  tagIds!: number[];
}
