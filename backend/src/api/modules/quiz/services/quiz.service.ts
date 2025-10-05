import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { QuizCategory } from '../entities/quiz-category.entity';
import { CreateQuizDto } from '../dto/create-quiz.dto';
import { QuizListQueryDto } from '../dto/quiz-list-query.dto';
import { QuizSummaryDto, QuizDetailDto } from '../dto/quiz-response.dto';
import { UpdateQuizDto } from '../dto/update-quiz.dto';
import { UserRole } from '../../user/entities/user.entity';
import { QuizProblemSetService } from './quiz-problem-set.service';
import { QuizRegistrationService } from './quiz-registration.service';

export interface AuthenticatedUser {
  userId: string;
  userName: string;
  role: UserRole;
}

/** Core service handling quiz CRUD operations and DTO projections. */
@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizCategory)
    private readonly categoryRepository: Repository<QuizCategory>,
    private readonly quizProblemSetService: QuizProblemSetService,
    private readonly quizRegistrationService: QuizRegistrationService,
  ) {}

  async createQuiz(
    dto: CreateQuizDto,
    user: AuthenticatedUser,
  ): Promise<QuizDetailDto> {
    const author =
      dto.author &&
      (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR)
        ? dto.author
        : user.userName;

    const quiz = this.quizRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      author,
      rank: dto.rank ?? 0,
      status: dto.status ?? true,
    });

    if (dto.categoryId) {
      quiz.category = await this.loadCategory(dto.categoryId);
    }

    const saved = await this.quizRepository.save(quiz);
    return this.mapToDetail(saved);
  }

  async findAll(query: QuizListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { search, author, status, categoryId } = query;

    const baseWhere: FindOptionsWhere<Quiz> = {};

    if (author) {
      baseWhere.author = author;
    }

    if (typeof status === 'boolean') {
      baseWhere.status = status;
    }

    if (categoryId) {
      baseWhere.category = { id: categoryId } as FindOptionsWhere<Quiz>['category'];
    }

    const where: FindOptionsWhere<Quiz>[] = search
      ? [
          { ...baseWhere, title: ILike(`%${search}%`) },
          { ...baseWhere, description: ILike(`%${search}%`) },
        ]
      : [baseWhere];

    const [items, total] = await this.quizRepository.findAndCount({
      where,
      relations: { category: true },
      order: { rank: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const summaries = items.map((quiz) => this.mapToSummary(quiz));
    return { items: summaries, total };
  }

  async findById(id: number): Promise<QuizDetailDto> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz ${id} not found`);
    }

    return this.mapToDetail(quiz);
  }

  async updateQuiz(
    id: number,
    dto: UpdateQuizDto,
    user: AuthenticatedUser,
  ): Promise<QuizDetailDto> {
    const quiz = await this.loadQuizOrThrow(id);
    this.assertCanMutate(quiz, user);

    if (dto.title !== undefined) {
      quiz.title = dto.title;
    }
    if (dto.description !== undefined) {
      quiz.description = dto.description;
    }
    if (dto.rank !== undefined) {
      quiz.rank = dto.rank;
    }
    if (dto.status !== undefined) {
      quiz.status = dto.status;
    }

    if (dto.categoryId !== undefined) {
      quiz.category = dto.categoryId
        ? await this.loadCategory(dto.categoryId)
        : null;
    }

    await this.quizRepository.save(quiz);

    if (dto.problems?.length) {
      await this.quizProblemSetService.updateDisplayIds(id, dto.problems);
    }

    return this.mapToDetail(quiz);
  }

  async removeQuiz(id: number, user: AuthenticatedUser): Promise<void> {
    const quiz = await this.loadQuizOrThrow(id);
    this.assertCanMutate(quiz, user);
    await this.quizRepository.delete({ id });
  }

  async loadQuizOrThrow(id: number): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({ where: { id }, relations: ['category'] });
    if (!quiz) {
      throw new NotFoundException(`Quiz ${id} not found`);
    }
    return quiz;
  }

  async ensureMutable(id: number, user: AuthenticatedUser): Promise<Quiz> {
    const quiz = await this.loadQuizOrThrow(id);
    this.assertCanMutate(quiz, user);
    return quiz;
  }

  async mapToDetail(quiz: Quiz): Promise<QuizDetailDto> {
    const problems = await this.quizProblemSetService.listProblems(quiz.id);
    const registrations = await this.quizRegistrationService.listRegistrations(quiz.id);

    return plainToInstance(
      QuizDetailDto,
      {
        ...quiz,
        rank: this.deriveCorrectRate(quiz),
        category: quiz.category
          ? { id: quiz.category.id, name: quiz.category.name }
          : null,
        problems,
        registrations,
      },
      { excludeExtraneousValues: true },
    );
  }

  mapToSummary(quiz: Quiz): QuizSummaryDto {
    return plainToInstance(
      QuizSummaryDto,
      {
        ...quiz,
        rank: this.deriveCorrectRate(quiz),
        category: quiz.category
          ? { id: quiz.category.id, name: quiz.category.name }
          : null,
      },
      { excludeExtraneousValues: true },
    );
  }

  private deriveCorrectRate(quiz: Quiz): number {
    // Placeholder: rank column currently stores the correct rate.
    return quiz.rank;
  }

  private assertCanMutate(quiz: Quiz, user: AuthenticatedUser) {
    if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
      return;
    }

    if (quiz.author === user.userName) {
      return;
    }

    throw new ForbiddenException('You cannot modify this quiz');
  }

  private async loadCategory(categoryId: number) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Quiz category ${categoryId} not found`);
    }

    return category;
  }
}
