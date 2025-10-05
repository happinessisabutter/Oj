import { IsOptional, IsString } from 'class-validator';

/** DTO describing the payload to create a new problem case. */
export class CreateProblemCaseDto {
  @IsString()
  input!: string;

  @IsString()
  output!: string;

  @IsOptional()
  @IsString()
  status?: string;
}
