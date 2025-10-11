import { ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ProblemService } from './problem.service';
import { Problem } from '../entities/problem.entity';
import { ProblemCase } from '../entities/problem-case.entity';
import { ProblemTag } from '../entities/problem-tag.entity';
import { UserRole } from '../../user/entities/user.entity';

describe('ProblemService (unit)', () => {
  const createRepoMock = () => ({
    findAndCount: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  });

  const user = { userId: 'u1', userName: 'alice', role: UserRole.USER };

  let problemRepository: ReturnType<typeof createRepoMock>;
  let problemCaseRepository: ReturnType<typeof createRepoMock>;
  let problemTagRepository: ReturnType<typeof createRepoMock>;
  let service: ProblemService;

  beforeEach(() => {
    problemRepository = createRepoMock();
    problemCaseRepository = createRepoMock();
    problemTagRepository = createRepoMock();

    service = new ProblemService(
      problemRepository as any,
      problemCaseRepository as any,
      problemTagRepository as any,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('filters results by tag list', async () => {
    const problem: Problem = plainToInstance(Problem, {
      id: 1,
      problemId: 'P100',
      title: 'Graph Paths',
      difficulty: 3,
      author: 'alice',
      stem: 'stem',
      input: 'input',
      output: 'output',
      example: 'example',
      source: '',
      timeLimit: 1,
      memoryLimit: 1,
      stackLimit: 128,
      spiCode: 'spi',
      spiLanguage: 'cpp',
      userExtraFile: '',
      judgeExtraFile: '',
      isRemoveEndBlank: false,
      openCaseResult: false,
      caseVersion: '1',
      isUploadCase: false,
      modifiedUser: 'alice',
    });

    problemRepository.findAndCount.mockResolvedValue([[problem], 1]);
    problemTagRepository.find.mockResolvedValue([
      { problem: { id: 1 }, tag: { name: 'graph' } },
    ]);

    const result = await service.findAll({
      page: 1,
      pageSize: 20,
      tags: ['graph'],
    } as any);

    expect(problemRepository.findAndCount).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('removes results without matching tags', async () => {
    const problem: Problem = plainToInstance(Problem, {
      id: 1,
      problemId: 'P200',
      title: 'DP',
      difficulty: 2,
      author: 'alice',
      stem: 'stem',
      input: 'input',
      output: 'output',
      example: 'example',
      source: '',
      timeLimit: 1,
      memoryLimit: 1,
      stackLimit: 128,
      spiCode: 'spi',
      spiLanguage: 'cpp',
      userExtraFile: '',
      judgeExtraFile: '',
      isRemoveEndBlank: false,
      openCaseResult: false,
      caseVersion: '1',
      isUploadCase: false,
      modifiedUser: 'alice',
    });

    problemRepository.findAndCount.mockResolvedValue([[problem], 1]);
    problemTagRepository.find.mockResolvedValue([
      { problem: { id: 1 }, tag: { name: 'graph' } },
    ]);

    const result = await service.findAll({
      page: 1,
      pageSize: 20,
      tags: ['math'],
    } as any);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('throws when user without permission mutates problem', async () => {
    const problem = plainToInstance(Problem, {
      id: 1,
      author: 'bob',
      modifiedUser: 'bob',
    });

    problemRepository.findOne.mockResolvedValue(problem);

    await expect(
      service.ensureMutable(1, { userId: 'u1', userName: 'alice', role: UserRole.USER }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows admins to mutate any problem', async () => {
    const problem = plainToInstance(Problem, {
      id: 1,
      author: 'bob',
      modifiedUser: 'bob',
    });

    problemRepository.findOne.mockResolvedValue(problem);

    await expect(
      service.ensureMutable(1, {
        userId: 'admin',
        userName: 'admin',
        role: UserRole.ADMIN,
      }),
    ).resolves.toEqual(problem);
  });
});
