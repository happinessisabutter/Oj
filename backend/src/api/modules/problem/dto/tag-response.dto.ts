import { Expose } from 'class-transformer';

/** DTO representing a tag exposed via the problem API surface. */
export class TagResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  color!: string | null;
}
