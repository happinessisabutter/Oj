import { QuizScoreboardService } from './quiz-scoreboard.service';
import { JudgeStatus } from '../../submission/entities/judge.entity';
import { plainToInstance } from 'class-transformer';

const createRepoMock = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
});

const createRepoMockWith = (methods: Record<string, any>) => ({
  ...createRepoMock(),
  ...methods,
});

describe('QuizScoreboardService (unit)', () => {
  let service: QuizScoreboardService;
  let quizRepository: any;
  let quizProblemRepository: any;
  let quizRegisterRepository: any;
  let quizRecordRepository: any;
  let judgeRepository: any;
  let judgeCaseRepository: any;

  beforeEach(() => {
    quizRepository = createRepoMock();
    quizProblemRepository = createRepoMockWith({ find: jest.fn() });
    quizRegisterRepository = createRepoMockWith({ find: jest.fn() });
    quizRecordRepository = createRepoMockWith({ find: jest.fn() });
    judgeRepository = createRepoMock();
    judgeCaseRepository = createRepoMockWith({ find: jest.fn() });

    service = new QuizScoreboardService(
      quizRepository,
      quizProblemRepository,
      quizRegisterRepository,
      quizRecordRepository,
      judgeRepository,
      judgeCaseRepository,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('sorts rows by solved count and exposes submitId with case details', async () => {
    quizRepository.findOne.mockResolvedValue({ id: 1 });

    quizProblemRepository.find.mockResolvedValue([
      {
        id: 10,
        displayId: 'A',
        problem: { id: 101, title: 'Two Sum' },
      },
    ]);

    quizRegisterRepository.find.mockResolvedValue([
      { id: 1, user: { userId: 'user-1', userName: 'alice' } },
      { id: 2, user: { userId: 'user-2', userName: 'bob' } },
    ]);

    quizRecordRepository.find.mockResolvedValue([
      {
        id: 500,
        tid: 1,
        tpid: 10,
        pid: 101,
        uid: 'user-1',
        submitId: 1001,
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        judge: { status: JudgeStatus.STATUS_ACCEPTED },
        problem: { id: 101 },
        user: { userId: 'user-1' },
      },
      {
        id: 501,
        tid: 1,
        tpid: 10,
        pid: 101,
        uid: 'user-2',
        submitId: 1002,
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        judge: { status: JudgeStatus.STATUS_WRONG_ANSWER },
        problem: { id: 101 },
        user: { userId: 'user-2' },
      },
    ]);

    judgeCaseRepository.find.mockResolvedValue([
      {
        submitId: 1001,
        caseId: '1',
        status: 'Accepted',
      },
      {
        submitId: 1002,
        caseId: '1',
        status: 'Wrong Answer',
      },
    ]);

    const scoreboard = await service.getScoreboard(1);
    expect(scoreboard.columns).toHaveLength(1);
    expect(scoreboard.rows).toHaveLength(2);

    const [winner, runnerUp] = scoreboard.rows;
    expect(winner.userId).toBe('user-1');
    expect(winner.solved).toBe(1);
    expect(winner.cells[0].submitId).toBe(1001);
    expect(winner.cells[0].cases).toHaveLength(1);

    expect(runnerUp.userId).toBe('user-2');
    expect(runnerUp.solved).toBe(0);
    expect(runnerUp.cells[0].submitId).toBe(1002);
  });
});
