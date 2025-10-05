import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QuizProblem } from '../entities/quiz-problem.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizProblemSummaryDto } from '../dto/quiz-response.dto';
import { plainToInstance } from 'class-transformer';
import {
  AttachQuizProblemItem,
  DetachQuizProblemsDto,
  QuizProblemDisplayItem,
} from '../dto/update-quiz-problems.dto';

/** Handles retrieval and maintenance of quiz problem sets. */
@Injectable()
export class QuizProblemSetService {
  private readonly logger = new Logger(QuizProblemSetService.name);

  constructor(
    @InjectRepository(QuizProblem)
    private readonly quizProblemRepository: Repository<QuizProblem>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
  ) {}

  async listProblems(quizId: number): Promise<QuizProblemSummaryDto[]> {
    await this.ensureQuizExists(quizId);

    const problems = await this.quizProblemRepository.find({
      where: { quiz: { id: quizId } },
      relations: ['problem'],
      order: { displayId: 'ASC' },
    });

    return problems.map((qp) =>
      plainToInstance(
        QuizProblemSummaryDto,
        {
          id: qp.id,
          displayId: qp.displayId,
          problemId: qp.problem.id,
          problemTitle: qp.problem.title,
        },
        { excludeExtraneousValues: true },
      ),
    );
  }

  async updateDisplayIds(
    quizId: number,
    updates: QuizProblemDisplayItem[] | undefined,
  ): Promise<void> {
    if (!updates?.length) {
      return;
    }

    await this.ensureQuizExists(quizId);

    const ids = updates.map((item) => item.quizProblemId);
    const existing = await this.quizProblemRepository.find({
      where: { id: In(ids), quiz: { id: quizId } },
    });
    const map = new Map(existing.map((item) => [item.id, item]));

    for (const update of updates) {
      const target = map.get(update.quizProblemId);
      if (!target) {
        this.logger.warn(
          `Quiz problem ${update.quizProblemId} not found in quiz ${quizId}, skipping display update`,
        );
        continue;
      }

      if (update.displayId !== undefined) {
        target.displayId = update.displayId;
        await this.quizProblemRepository.save(target);
      }
    }
  }

  async attachProblems(
    quizId: number,
    inputs: AttachQuizProblemItem[],
  ): Promise<void> {
    if (!inputs.length) {
      return;
    }

    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException(`Quiz ${quizId} not found`);
    }

    const quizProblemEntities = inputs.map((input) =>
      this.quizProblemRepository.create({
        quiz,
        problem: { id: input.problemId } as any,
        displayId: input.displayId,
      }),
    );

    await this.quizProblemRepository.save(quizProblemEntities);
  }

  async detachProblems(
    quizId: number,
    input: DetachQuizProblemsDto,
  ): Promise<void> {
    if (!input.quizProblemIds.length) {
      return;
    }

    await this.quizProblemRepository.delete({
      id: In(input.quizProblemIds),
      quiz: { id: quizId } as any,
    });
  }

  private async ensureQuizExists(quizId: number): Promise<void> {
    const exists = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!exists) {
      throw new NotFoundException(`Quiz ${quizId} not found`);
    }
  }
}
