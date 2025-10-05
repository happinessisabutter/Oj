import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProblemCase } from '../entities/problem-case.entity';
import { Problem } from '../entities/problem.entity';
import { CreateProblemCaseDto } from '../dto/create-problem-case.dto';
import { UpdateProblemCaseDto } from '../dto/update-problem-case.dto';
import { UserRole } from '../../user/entities/user.entity';
import { ProblemService } from './problem.service';

/**
 * Service handling lifecycle operations for individual problem test cases.
 */
@Injectable()
export class ProblemCaseService {
  constructor(
    @InjectRepository(ProblemCase)
    private readonly problemCaseRepository: Repository<ProblemCase>,
    @InjectRepository(Problem)
    private readonly problemRepository: Repository<Problem>,
    private readonly problemService: ProblemService,
  ) {}

  async listCases(problemId: number): Promise<ProblemCase[]> {
    await this.ensureProblemExists(problemId);
    return this.problemCaseRepository.find({
      where: { problem: { id: problemId } },
      order: { id: 'ASC' },
    });
  }

  async createCase(
    problemId: number,
    dto: CreateProblemCaseDto,
    user: { userId: string; userName: string; role: UserRole },
  ): Promise<ProblemCase> {
    const problem = await this.problemService.ensureMutable(problemId, user);

    const nextCase = this.problemCaseRepository.create({
      problem,
      problemId: problem.id,
      input: dto.input,
      output: dto.output,
      status: dto.status ?? '0 available',
    });

    return this.problemCaseRepository.save(nextCase);
  }

  async updateCase(
    problemId: number,
    caseId: number,
    dto: UpdateProblemCaseDto,
    user: { userId: string; userName: string; role: UserRole },
  ): Promise<ProblemCase> {
    await this.problemService.ensureMutable(problemId, user);

    const testCase = await this.problemCaseRepository.findOne({
      where: { id: caseId, problem: { id: problemId } },
    });

    if (!testCase) {
      throw new NotFoundException(
        `Case ${caseId} not found for problem ${problemId}`,
      );
    }

    if (dto.input !== undefined) {
      testCase.input = dto.input;
    }
    if (dto.output !== undefined) {
      testCase.output = dto.output;
    }
    if (dto.status !== undefined) {
      testCase.status = dto.status;
    }

    return this.problemCaseRepository.save(testCase);
  }

  async deleteCase(
    problemId: number,
    caseId: number,
    user: { userId: string; userName: string; role: UserRole },
  ): Promise<void> {
    await this.problemService.ensureMutable(problemId, user);

    const existing = await this.problemCaseRepository.findOne({
      where: { id: caseId, problem: { id: problemId } },
    });

    if (!existing) {
      throw new NotFoundException(
        `Case ${caseId} not found for problem ${problemId}`,
      );
    }

    await this.problemCaseRepository.delete({ id: existing.id });
  }

  private async ensureProblemExists(problemId: number) {
    const problem = await this.problemRepository.findOne({
      where: { id: problemId },
    });
    if (!problem) {
      throw new NotFoundException(`Problem ${problemId} not found`);
    }
  }
}
