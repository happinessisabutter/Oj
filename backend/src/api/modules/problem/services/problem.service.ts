import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Problem } from '../entities/problem.entity';
import { ProblemCase } from '../entities/problem-case.entity';
import { ProblemTag } from '../entities/problem-tag.entity';
import { ProblemListQueryDto } from '../dto/problem-list-query.dto';
import { CreateProblemDto } from '../dto/create-problem.dto';
import { UpdateProblemDto } from '../dto/update-problem.dto';
import {
  ProblemCaseMetaDto,
  ProblemDetailDto,
  ProblemSummaryDto,
} from '../dto/problem-response.dto';
import { UserRole } from '../../user/entities/user.entity';

type AuthenticatedUser = {
  userId: string;
  userName: string;
  role: UserRole;
};

/** Core service managing problem CRUD and query operations. */
@Injectable()
export class ProblemService {
  constructor(
    @InjectRepository(Problem)
    private readonly problemRepository: Repository<Problem>,
    @InjectRepository(ProblemCase)
    private readonly problemCaseRepository: Repository<ProblemCase>,
    @InjectRepository(ProblemTag)
    private readonly problemTagRepository: Repository<ProblemTag>,
  ) {}

  async findAll(query: ProblemListQueryDto) {
    // TODO: Introduce caching via Nest CacheModule when list traffic warrants it.
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { search, difficulty, difficultyMin, difficultyMax, tags } = query;

    const baseWhere: FindOptionsWhere<Problem> = {};

    const difficultyCondition = this.buildDifficultyCondition(
      difficulty,
      difficultyMin,
      difficultyMax,
    );

    if (difficultyCondition) {
      baseWhere.difficulty = difficultyCondition;
    }

    const where: FindOptionsWhere<Problem>[] = this.buildSearchWhere(
      baseWhere,
      search,
    );

    const [items, total] = await this.problemRepository.findAndCount({
      where,
      order: { problemId: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const tagsMap = await this.loadTagsForProblems(items.map((p) => p.id));

    const filteredItems = tags?.length
      ? items.filter((problem) =>
          this.problemHasAllTags(tagsMap.get(problem.id) ?? [], tags),
        )
      : items;

    const totalFiltered = tags?.length ? filteredItems.length : total;
    const paged = tags?.length
      ? filteredItems.slice((page - 1) * pageSize, page * pageSize)
      : filteredItems;

    const pagedTagsMap = await this.loadTagsForProblems(paged.map((p) => p.id));
    const summaries = await this.mapToSummaries(paged, pagedTagsMap);
    return { items: summaries, total: totalFiltered };
  }

  async findById(id: number): Promise<ProblemDetailDto> {
    const problem = await this.problemRepository.findOne({ where: { id } });
    if (!problem) {
      throw new NotFoundException(`Problem with id ${id} not found`);
    }

    return this.mapToDetail(problem);
  }

  async findByProblemId(problemId: string): Promise<ProblemDetailDto> {
    const problem = await this.problemRepository.findOne({
      where: { problemId },
    });
    if (!problem) {
      throw new NotFoundException(`Problem ${problemId} not found`);
    }

    return this.mapToDetail(problem);
  }

  async createProblem(
    dto: CreateProblemDto,
    user: AuthenticatedUser,
  ): Promise<ProblemDetailDto> {
    await this.ensureProblemIdIsUnique(dto.problemId);

    const problem = this.problemRepository.create({
      problemId: dto.problemId,
      title: dto.title,
      author: dto.author ?? user.userName,
      timeLimit: dto.timeLimit ?? null,
      memoryLimit: dto.memoryLimit ?? null,
      stackLimit: dto.stackLimit ?? 128,
      stem: dto.stem,
      input: dto.input,
      output: dto.output,
      example: dto.example,
      source: dto.source ?? '',
      difficulty: dto.difficulty,
      spiCode: dto.spiCode ?? 'spi',
      spiLanguage: dto.spiLanguage ?? 'cpp',
      userExtraFile: dto.userExtraFile ?? '',
      judgeExtraFile: dto.judgeExtraFile ?? '',
      isRemoveEndBlank: dto.isRemoveEndBlank ?? false,
      openCaseResult: dto.openCaseResult ?? false,
      caseVersion: dto.caseVersion ?? '1',
      isUploadCase: dto.isUploadCase ?? false,
      modifiedUser: user.userName,
    });

    const saved = await this.problemRepository.save(problem);
    return this.mapToDetail(saved);
  }

  async updateProblem(
    id: number,
    dto: UpdateProblemDto,
    user: AuthenticatedUser,
  ): Promise<ProblemDetailDto> {
    const problem = await this.problemRepository.findOne({ where: { id } });
    if (!problem) {
      throw new NotFoundException(`Problem with id ${id} not found`);
    }

    this.assertCanMutate(problem, user);

    if (dto.problemId && dto.problemId !== problem.problemId) {
      await this.ensureProblemIdIsUnique(dto.problemId, id);
      problem.problemId = dto.problemId;
    }

    if (dto.title) {
      problem.title = dto.title;
    }

    if (dto.author !== undefined) {
      problem.author = dto.author;
    }

    if (dto.timeLimit !== undefined) {
      problem.timeLimit = dto.timeLimit;
    }

    if (dto.memoryLimit !== undefined) {
      problem.memoryLimit = dto.memoryLimit;
    }

    if (dto.stackLimit !== undefined) {
      problem.stackLimit = dto.stackLimit;
    }

    if (dto.stem) {
      problem.stem = dto.stem;
    }

    if (dto.input) {
      problem.input = dto.input;
    }

    if (dto.output) {
      problem.output = dto.output;
    }

    if (dto.example) {
      problem.example = dto.example;
    }

    if (dto.source !== undefined) {
      problem.source = dto.source;
    }

    if (dto.difficulty !== undefined) {
      problem.difficulty = dto.difficulty;
    }

    if (dto.spiCode !== undefined) {
      problem.spiCode = dto.spiCode;
    }

    if (dto.spiLanguage !== undefined) {
      problem.spiLanguage = dto.spiLanguage;
    }

    if (dto.userExtraFile !== undefined) {
      problem.userExtraFile = dto.userExtraFile;
    }

    if (dto.judgeExtraFile !== undefined) {
      problem.judgeExtraFile = dto.judgeExtraFile;
    }

    if (dto.isRemoveEndBlank !== undefined) {
      problem.isRemoveEndBlank = dto.isRemoveEndBlank;
    }

    if (dto.openCaseResult !== undefined) {
      problem.openCaseResult = dto.openCaseResult;
    }

    if (dto.caseVersion !== undefined) {
      problem.caseVersion = dto.caseVersion;
    }

    if (dto.isUploadCase !== undefined) {
      problem.isUploadCase = dto.isUploadCase;
    }

    problem.modifiedUser = user.userName;

    await this.problemRepository.save(problem);

    return this.mapToDetail(problem);
  }

  async removeProblem(id: number, user: AuthenticatedUser): Promise<void> {
    const problem = await this.problemRepository.findOne({ where: { id } });
    if (!problem) {
      throw new NotFoundException(`Problem with id ${id} not found`);
    }

    this.assertCanMutate(problem, user);
    await this.problemCaseRepository.delete({ problemId: id });
    await this.problemTagRepository.delete({ problem: { id } as any });
    await this.problemRepository.delete({ id });
  }

  /**
   * Ensures the problem exists and the caller can mutate it, returning the entity.
   */
  async ensureMutable(
    problemId: number,
    user: AuthenticatedUser,
  ): Promise<Problem> {
    const problem = await this.problemRepository.findOne({ where: { id: problemId } });
    if (!problem) {
      throw new NotFoundException(`Problem with id ${problemId} not found`);
    }

    this.assertCanMutate(problem, user);
    return problem;
  }

  private buildDifficultyCondition(
    difficulty?: number,
    min?: number,
    max?: number,
  ) {
    if (typeof difficulty === 'number') {
      return difficulty;
    }

    if (min !== undefined && max !== undefined) {
      return Between(min, max);
    }

    if (min !== undefined) {
      return MoreThanOrEqual(min);
    }

    if (max !== undefined) {
      return LessThanOrEqual(max);
    }

    return undefined;
  }

  private buildSearchWhere(
    base: FindOptionsWhere<Problem>,
    search?: string,
  ): FindOptionsWhere<Problem>[] {
    if (!search) {
      return [base];
    }

    return [
      { ...base, title: ILike(`%${search}%`) },
      { ...base, problemId: ILike(`%${search}%`) },
    ];
  }

  private async ensureProblemIdIsUnique(problemId: string, excludeId?: number) {
    const exists = await this.problemRepository.findOne({
      where: { problemId },
    });

    if (exists && exists.id !== excludeId) {
      throw new ForbiddenException(
        `Problem with display id ${problemId} already exists`,
      );
    }
  }

  private assertCanMutate(problem: Problem, user: AuthenticatedUser) {
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
      return;
    }

    if (problem.author === user.userName || problem.modifiedUser === user.userName) {
      return;
    }

    throw new ForbiddenException('You are not allowed to edit this problem');
  }

  private async loadTagsForProblems(problemIds: number[]) {
    const map = new Map<number, string[]>();
    if (!problemIds.length) {
      return map;
    }

    const relations = await this.problemTagRepository.find({
      where: { problem: { id: In(problemIds) } },
      relations: ['problem', 'tag'],
    });

    relations.forEach(({ problem, tag }) => {
      const bucket = map.get(problem.id) ?? [];
      bucket.push(tag.name);
      map.set(problem.id, bucket);
    });

    problemIds.forEach((id) => {
      if (!map.has(id)) {
        map.set(id, []);
      }
    });

    return map;
  }

  private problemHasAllTags(existing: string[], requested: string[]) {
    const lower = existing.map((tag) => tag.toLowerCase());
    return requested.every((tag) => lower.includes(tag.toLowerCase()));
  }

  private async mapToSummaries(
    problems: Problem[],
    tagsMap: Map<number, string[]>,
  ) {
    return problems.map((problem) =>
      plainToInstance(
        ProblemSummaryDto,
        {
          ...problem,
          tags: tagsMap.get(problem.id) ?? [],
        },
        { excludeExtraneousValues: true },
      ),
    );
  }

  private async mapToDetail(problem: Problem): Promise<ProblemDetailDto> {
    const [cases, tagsMap] = await Promise.all([
      this.problemCaseRepository.find({
        where: { problem: { id: problem.id } },
        order: { id: 'ASC' },
      }),
      this.loadTagsForProblems([problem.id]),
    ]);

    const caseDtos = plainToInstance(
      ProblemCaseMetaDto,
      cases.map((testCase) => ({ id: testCase.id, status: testCase.status })),
      { excludeExtraneousValues: true },
    );

    return plainToInstance(
      ProblemDetailDto,
      {
        ...problem,
        tags: tagsMap.get(problem.id) ?? [],
        cases: caseDtos,
      },
      { excludeExtraneousValues: true },
    );
  }
}
