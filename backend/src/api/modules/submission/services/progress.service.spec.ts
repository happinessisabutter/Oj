import { plainToInstance } from 'class-transformer';
import { SubmissionProgressService } from './progress.service';
import { Judge, JudgeStatus } from '../entities/judge.entity';
import { Problem } from '../../problem/entities/problem.entity';

describe('SubmissionProgressService (unit)', () => {
  const createRepoMock = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  });

  let judgeRepository: any;
  let problemRepository: any;
  let quizRecordRepository: any;
  let service: SubmissionProgressService;

  beforeEach(() => {
    judgeRepository = createRepoMock();
    problemRepository = createRepoMock();
    quizRecordRepository = createRepoMock();

    service = new SubmissionProgressService(
      judgeRepository,
      problemRepository,
      quizRecordRepository,
    );
  });

  afterEach(() => jest.resetAllMocks());

  it('returns only solved problems when onlySolved flag is true', async () => {
    const accepted = plainToInstance(Judge, {
      submitId: 1,
      pid: 10,
      displayPid: 'P10',
      uid: 'user-1',
      status: JudgeStatus.STATUS_ACCEPTED,
      submitTime: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      problem: { id: 10, title: 'Two Sum' },
    });
    const failed = plainToInstance(Judge, {
      submitId: 2,
      pid: 20,
      displayPid: 'P20',
      uid: 'user-1',
      status: JudgeStatus.STATUS_WRONG_ANSWER,
      submitTime: new Date('2024-01-02T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      problem: { id: 20, title: 'Graph' },
    });

    judgeRepository.find.mockResolvedValue([accepted, failed]);
    quizRecordRepository.find.mockResolvedValue([]);

    const results = await service.listUserProblems('user-1', {
      onlySolved: true,
    });

    expect(results).toHaveLength(1);
    expect(results[0].displayProblemId).toBe('P10');
  });

  it('returns history with latest submissions first', async () => {
    const first = plainToInstance(Judge, {
      submitId: 10,
      pid: 30,
      displayPid: 'P30',
      uid: 'user-2',
      status: JudgeStatus.STATUS_WRONG_ANSWER,
      errorMessage: 'WA on sample',
      language: 'cpp',
      time: 100,
      memory: 32,
      submitTime: new Date('2024-01-01T00:00:00Z'),
    });
    const second = plainToInstance(Judge, {
      submitId: 11,
      pid: 30,
      displayPid: 'P30',
      uid: 'user-2',
      status: JudgeStatus.STATUS_ACCEPTED,
      errorMessage: null,
      language: 'cpp',
      time: 50,
      memory: 16,
      submitTime: new Date('2024-01-02T00:00:00Z'),
    });

    judgeRepository.find.mockResolvedValue([second, first]);
    problemRepository.findOne.mockResolvedValue(
      plainToInstance(Problem, { problemId: 'P30', title: 'Binary Search' }),
    );

    const history = await service.getProblemHistory('user-2', 'P30');
    expect(history.displayProblemId).toBe('P30');
    expect(history.title).toBe('Binary Search');
    expect(history.submissions[0].status).toBe(JudgeStatus.STATUS_ACCEPTED);
    expect(history.submissions[0].submitId).toBe(11);
  });
});
