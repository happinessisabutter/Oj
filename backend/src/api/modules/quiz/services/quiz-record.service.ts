import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { QuizRecord } from '../entities/quiz-record.entity';
import { QuizProblem } from '../entities/quiz-problem.entity';
import { QuizRegister } from '../entities/quiz-register.entity';
import { QuizRecordDto } from '../dto/quiz-response.dto';
import { plainToInstance } from 'class-transformer';
import { CreateQuizRecordDto } from '../dto/create-quiz-record.dto';
import { QuizRecordQueryDto } from '../dto/quiz-record-query.dto';
import { UserRole } from '../../user/entities/user.entity';

export interface AuthenticatedUser {
  userId: string;
  userName: string;
  role: UserRole;
}

/** Service responsible for quiz record persistence and lookups. */
@Injectable()
export class QuizRecordService {
  constructor(
    @InjectRepository(QuizRecord)
    private readonly quizRecordRepository: Repository<QuizRecord>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizRegister)
    private readonly quizRegisterRepository: Repository<QuizRegister>,
    @InjectRepository(QuizProblem)
    private readonly quizProblemRepository: Repository<QuizProblem>,
  ) {}

  async createRecord(
    quizId: number,
    dto: CreateQuizRecordDto,
    user: AuthenticatedUser,
  ): Promise<QuizRecordDto> {
    const quiz = await this.ensureQuizExists(quizId);

    if (user.role !== UserRole.ADMIN && user.userId !== dto.userId) {
      throw new ForbiddenException('Cannot submit record for another user');
    }

    const registration = await this.quizRegisterRepository.findOne({
      where: {
        quiz: { id: quizId },
        user: { userId: dto.userId },
      },
    });

    if (!registration) {
      throw new ForbiddenException('User must register before recording results');
    }

    const quizProblem = await this.quizProblemRepository.findOne({
      where: { id: dto.quizProblemId, quiz: { id: quizId } },
      relations: ['problem'],
    });

    if (!quizProblem) {
      throw new NotFoundException('Quiz problem not found for quiz');
    }

    if (quizProblem.problem.id !== dto.problemId) {
      throw new ForbiddenException('Quiz problem does not reference provided problem');
    }

    let record = await this.quizRecordRepository.findOne({
      where: {
        tid: quiz.id,
        uid: dto.userId,
        pid: dto.problemId,
      },
    });

    if (!record) {
      record = this.quizRecordRepository.create({
        tid: quiz.id,
        tpid: dto.quizProblemId,
        pid: dto.problemId,
        problem: quizProblem.problem,
        uid: dto.userId,
        submitId: dto.submissionId ?? null,
      });
    } else {
      record.submitId = dto.submissionId ?? record.submitId;
    }

    record.tpid = dto.quizProblemId;
    record.pid = dto.problemId;
    record.problem = quizProblem.problem;
    record.uid = dto.userId;

    const saved = await this.quizRecordRepository.save(record);
    return this.mapRecord(saved);
  }

  async findRecords(
    quizId: number,
    query: QuizRecordQueryDto,
  ): Promise<QuizRecordDto[]> {
    await this.ensureQuizExists(quizId);

    const where: FindOptionsWhere<QuizRecord> = { tid: quizId };

    if (query.userId) {
      where.uid = query.userId;
    }

    const records = await this.quizRecordRepository.find({
      where,
      relations: {
        problem: true,
        user: true,
        judge: true,
      },
      order: { updatedAt: 'DESC' },
    });

    return records.map((record) => this.mapRecord(record));
  }

  private async ensureQuizExists(quizId: number): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException(`Quiz ${quizId} not found`);
    }
    return quiz;
  }

  private mapRecord(record: QuizRecord): QuizRecordDto {
    return plainToInstance(
      QuizRecordDto,
      {
        id: record.id,
        problemId: record.pid,
        userId: record.uid,
        submitId: record.submitId,
        updatedAt: record.updatedAt,
      },
      { excludeExtraneousValues: true },
    );
  }
}
