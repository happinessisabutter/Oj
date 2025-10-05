import { PartialType } from '@nestjs/mapped-types';
import { CreateProblemCaseDto } from './create-problem-case.dto';

/** DTO describing patchable fields on an existing problem case. */
export class UpdateProblemCaseDto extends PartialType(CreateProblemCaseDto) {}
