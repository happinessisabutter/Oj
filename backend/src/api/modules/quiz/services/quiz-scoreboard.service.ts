import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { QuizProblem } from '../entities/quiz-problem.entity';
import { QuizRegister } from '../entities/quiz-register.entity';
import { QuizRecord } from '../entities/quiz-record.entity';
import { Quiz } from '../entities/quiz.entity';
import { Judge, JudgeStatus } from '../../submission/entities/judge.entity';
import { JudgeCase } from '../../submission/entities/judge-case.entity';
import {
  ScoreboardCellDto,
  ScoreboardColumnDto,
  ScoreboardDto,
  ScoreboardRowDto,
  ScoreboardCaseStatusDto,
} from '../dto/scoreboard.dto';

/** Aggregates a read-only scoreboard sorted by correct rate and tie-breakers. */
@Injectable()
export class QuizScoreboardService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizProblem)
    private readonly quizProblemRepository: Repository<QuizProblem>,
    @InjectRepository(QuizRegister)
    private readonly quizRegisterRepository: Repository<QuizRegister>,
    @InjectRepository(QuizRecord)
    private readonly quizRecordRepository: Repository<QuizRecord>,
    @InjectRepository(Judge)
    private readonly judgeRepository: Repository<Judge>,
    @InjectRepository(JudgeCase)
    private readonly judgeCaseRepository: Repository<JudgeCase>,
  ) {}

  async getScoreboard(quizId: number): Promise<ScoreboardDto> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException(`Quiz ${quizId} not found`);
    }

    const columnsEntities = await this.quizProblemRepository.find({
      where: { quiz: { id: quizId } },
      relations: ['problem'],
      order: { displayId: 'ASC' },
    });

    const columns: ScoreboardColumnDto[] = columnsEntities.map((qp) =>
      plainToInstance(
        ScoreboardColumnDto,
        {
          displayId: qp.displayId,
          problemId: qp.problem.id,
          title: qp.problem.title,
        },
        { excludeExtraneousValues: true },
      ),
    );

    const registrations = await this.quizRegisterRepository.find({
      where: { quiz: { id: quizId } },
      relations: ['user'],
      order: { id: 'ASC' },
    });

    const userIds = registrations.map((r) => r.user.userId);

    const records = await this.quizRecordRepository.find({
      where: { tid: quizId },
      relations: {
        judge: true,
        problem: true,
        user: true,
      },
      order: { updatedAt: 'DESC' },
    });

    const byUserProblem = new Map<string, Map<number, QuizRecord>>();
    const attemptsByUser = new Map<string, number>();
    const lastUpdatedByUser = new Map<string, Date>();

    for (const rec of records) {
      const uid = rec.uid;
      attemptsByUser.set(uid, (attemptsByUser.get(uid) ?? 0) + 1);
      const prevUpdated = lastUpdatedByUser.get(uid)?.getTime() ?? 0;
      const updatedAt = rec.updatedAt?.getTime() ?? 0;
      if (updatedAt > prevUpdated) {
        lastUpdatedByUser.set(uid, rec.updatedAt);
      }

      let map = byUserProblem.get(uid);
      if (!map) {
        map = new Map<number, QuizRecord>();
        byUserProblem.set(uid, map);
      }

      const existing = map.get(rec.pid);
      if (!existing) {
        map.set(rec.pid, rec);
        continue;
      }

      const best = this.pickBetter(existing, rec);
      map.set(rec.pid, best);
    }

    // Preload judge cases for best records: collect submitIds after selecting best
    // Build chosen best records map and preload their judge cases
    const submitIds: number[] = [];
    byUserProblem.forEach((pmap) => {
      pmap.forEach((rec) => {
        if (rec.submitId != null) submitIds.push(rec.submitId);
      });
    });

    const caseMap = new Map<number, ScoreboardCaseStatusDto[]>();
    if (submitIds.length) {
      const caseRows = await this.judgeCaseRepository.find({
        where: { submitId: In(submitIds) },
        order: { id: 'ASC' },
      });
      for (const c of caseRows) {
        const bucket = caseMap.get(c.submitId) ?? [];
        bucket.push(
          plainToInstance(
            ScoreboardCaseStatusDto,
            { caseId: c.caseId, status: c.status },
            { excludeExtraneousValues: true },
          ),
        );
        caseMap.set(c.submitId, bucket);
      }
    }

    const totalProblems = columns.length || 1; // guard division
    const rows: ScoreboardRowDto[] = registrations.map((reg) => {
      const uid = reg.user.userId;
      const upMap = byUserProblem.get(uid) ?? new Map<number, QuizRecord>();
      let solved = 0;
      const cells: ScoreboardCellDto[] = columns.map((col) => {
        const rec = upMap.get(col.problemId);
        if (!rec) {
          return plainToInstance(
            ScoreboardCellDto,
            { problemId: col.problemId, status: 'none', submitId: null, updatedAt: null },
            { excludeExtraneousValues: true },
          );
        }
        const accepted = rec.judge?.status === JudgeStatus.STATUS_ACCEPTED;
        if (accepted) {
          solved += 1;
        }
        return plainToInstance(
          ScoreboardCellDto,
          {
            problemId: col.problemId,
            status: accepted ? 'accepted' : 'failed',
            submitId: rec.submitId,
            updatedAt: rec.updatedAt ?? null,
            cases:
              rec.submitId != null ? caseMap.get(rec.submitId) ?? [] : undefined,
          },
          { excludeExtraneousValues: true },
        );
      });

      const attempts = attemptsByUser.get(uid) ?? 0;
      const lastUpdated = lastUpdatedByUser.get(uid) ?? null;
      const correctRate = Number((solved / totalProblems).toFixed(4));

      return plainToInstance(
        ScoreboardRowDto,
        {
          userId: uid,
          username: reg.user.userName,
          solved,
          correctRate,
          attempts,
          lastUpdated,
          cells,
        },
        { excludeExtraneousValues: true },
      );
    });

    rows.sort((a, b) => {
      // Primary: total AC (solved) desc
      if (b.solved !== a.solved) return b.solved - a.solved;
      // Secondary: correct rate desc (stabilizer when problem counts differ)
      if (b.correctRate !== a.correctRate) return b.correctRate - a.correctRate;
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
      const at = a.lastUpdated ? a.lastUpdated.getTime() : Infinity;
      const bt = b.lastUpdated ? b.lastUpdated.getTime() : Infinity;
      return at - bt;
    });

    return plainToInstance(
      ScoreboardDto,
      { columns, rows },
      { excludeExtraneousValues: true },
    );
  }

  private pickBetter(a: QuizRecord, b: QuizRecord): QuizRecord {
    const aAccepted = a.judge?.status === JudgeStatus.STATUS_ACCEPTED;
    const bAccepted = b.judge?.status === JudgeStatus.STATUS_ACCEPTED;
    if (aAccepted && !bAccepted) return a;
    if (bAccepted && !aAccepted) return b;
    // If both same class, prefer latest updated
    const at = a.updatedAt?.getTime() ?? 0;
    const bt = b.updatedAt?.getTime() ?? 0;
    return bt >= at ? b : a;
  }
}
