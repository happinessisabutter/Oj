import { Expose } from 'class-transformer';

/** DTO representing a test case exposed through the API. */
export class ProblemCaseResponseDto {
  @Expose()
  id!: number;

  @Expose()
  input!: string;

  @Expose()
  output!: string;

  @Expose()
  status!: string;
}
