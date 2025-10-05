import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Judge } from '../entities/judge.entity';
import { Problem } from '../../problem/entities/problem.entity';
import { ProblemSubmissionHistoryResponseDto, ProblemSubmissionHistoryDto, ProblemProgressDto } from '../dto/problem-progress.dto';
import { QuizRecord } from '../../quiz/entities/quiz-record.entity';

interface ProgressQueryOptions {
  quizId?: number;
  onlySolved?: boolean;
}

/** Aggregates per-user progress metrics for problems. */
@Injectable()
export class SubmissionProgressService {
  constructor(
    @InjectRepository(Judge)
    private readonly judgeRepository: Repository<Judge>,
    @InjectRepository(Problem)
    private readonly problemRepository: Repository<Problem>,
    @InjectRepository(QuizRecord)
    private readonly quizRecordRepository: Repository<QuizRecord>,
  ) {}

  async listUserProblems(
    userId: string,
    options: ProgressQueryOptions,
  ): Promise<ProblemProgressDto[]> {
    const { quizId, onlySolved } = options;

    let judges: Judge[];
    if (quizId) {
      const quizRecords = await this.quizRecordRepository.find({
        where: { tid: quizId, uid: userId },
        relations: ['problem'],
      });
      const problemIds = Array.from(new Set(quizRecords.map((record) => record.pid)));
      if (!problemIds.length) {
        return [];
      }
      judges = await this.judgeRepository.find({
        where: {
          uid: userId,
          pid: In(problemIds),
        },
        relations: { problem: true },
        order: { submitTime: 'DESC' },
      });
    } else {
      judges = await this.judgeRepository.find({
        where: { uid: userId },
        relations: { problem: true },
        order: { submitTime: 'DESC' },
      });
    }

    const perProblem = new Map<number, ProblemProgressDto>();

    for (const judge of judges) {
      const key = judge.pid;
      const entry = perProblem.get(key);

      if (!entry) {
        perProblem.set(key, {
          problemId: judge.problem?.id ?? judge.pid,
          displayProblemId: judge.displayPid,
          title: judge.problem?.title ?? '',
          solved: judge.status === 0,
          attempts: 1,
          lastStatus: judge.status,
          lastSubmitId: judge.submitId,
          lastUpdated: judge.updatedAt ?? judge.submitTime,
        });
        continue;
      }

      entry.attempts += 1;
      if (judge.status === 0) {
        entry.solved = true;
      }

      const currentTime = judge.updatedAt?.getTime() ?? judge.submitTime.getTime();
      const knownTime = entry.lastUpdated?.getTime() ?? 0;

      if (currentTime > knownTime) {
        entry.lastStatus = judge.status;
        entry.lastSubmitId = judge.submitId;
        entry.lastUpdated = judge.updatedAt ?? judge.submitTime;
      }
    }

    const items = Array.from(perProblem.values());

    const filtered = onlySolved ? items.filter((item) => item.solved) : items;

    filtered.sort((a, b) => {
      if (a.solved !== b.solved) {
        return a.solved ? -1 : 1; // solved first
      }
      const timeA = a.lastUpdated?.getTime() ?? 0;
      const timeB = b.lastUpdated?.getTime() ?? 0;
      return timeB - timeA;
    });

    return filtered;
  }

  async getProblemHistory(
    userId: string,
    displayProblemId: string,
  ): Promise<ProblemSubmissionHistoryResponseDto> {
    const judges = await this.judgeRepository.find({
      where: { uid: userId, displayPid: displayProblemId },
      order: { submitTime: 'DESC' },
    });

    if (!judges.length) {
      throw new NotFoundException(
        `No submissions found for problem ${displayProblemId}`,
      );
    }

    const problem = await this.problemRepository.findOne({
      where: { problemId: displayProblemId },
    });

    const submissions = judges.map((judge) =>
      plainToInstance(
        ProblemSubmissionHistoryDto,
        {
          submitId: judge.submitId,
          status: judge.status,
          errorMessage: judge.errorMessage,
          language: judge.language,
          time: judge.time,
          memory: judge.memory,
          submitTime: judge.submitTime,
        },
        { excludeExtraneousValues: true },
      ),
    );

    return plainToInstance(
      ProblemSubmissionHistoryResponseDto,
      {
        displayProblemId,
        title: problem?.title ?? displayProblemId,
        submissions,
      },
      { excludeExtraneousValues: true },
    );
  }
}
