import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Problem, JudgeMode } from 'src/api/modules/problem/entities/problem.entity';
import { ProblemCase } from 'src/api/modules/problem/entities/problem-case.entity';
import { JudgeGlobalDto } from '../judge/model/judge-global.dto';
import { JudgeTaskPayload } from '../judge/model/judgeTaskPlayload';
import { JudgeCaseDto } from '../judge/model/judge-case.dto';

@Injectable()
export class ProblemDataService {
  private readonly logger = new Logger(ProblemDataService.name);

  constructor(
    @InjectRepository(Problem)
    private readonly problemRepository: Repository<Problem>,
    @InjectRepository(ProblemCase)
    private readonly problemCaseRepository: Repository<ProblemCase>,
  ) {}

  async buildJudgeGlobalDto(
    payload: JudgeTaskPayload,
  ): Promise<JudgeGlobalDto> {
    try {
      const problemIdNum = parseInt(payload.problemId, 10);
      const problem = await this.problemRepository.findOne({
        where: { id: problemIdNum },
      });
      if (!problem) {
        throw new Error(`Problem with ID ${payload.problemId} not found`);
      }

      const problemCases = await this.problemCaseRepository.find({
        where: { problemId: problemIdNum },
        order: { id: 'ASC' },
      });

      const testCases: JudgeCaseDto[] = problemCases.map((c) => ({
        caseId: c.id,
        input: c.input,
        expectedOutput: c.output,
      }));

      return {
        submissionId: payload.submissionId,
        problemId: problemIdNum,
        judgeMode: problem.judgeMode as JudgeMode,
        userCode: payload.code,
        language: payload.language,
        maxTime: problem.timeLimit ?? 1000, // Default to 1000ms if null
        maxMemory: problem.memoryLimit ?? 256, // Default to 256MB if null
        testCases: testCases,
        spjCode: problem.spjCode,
        spjLanguage: problem.spjLanguage,
      };
    } catch (error) {
      this.logger.error(
        `Error building JudgeGlobalDto for submission ${payload.submissionId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
