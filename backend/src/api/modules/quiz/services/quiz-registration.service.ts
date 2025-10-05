import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { QuizRegister } from '../entities/quiz-register.entity';
import { QuizRegistrationDto } from '../dto/quiz-response.dto';
import { plainToInstance } from 'class-transformer';
import { User, UserRole } from '../../user/entities/user.entity';

export interface AuthenticatedUser {
  userId: string;
  userName: string;
  role: UserRole;
}

/** Service encapsulating quiz registration lifecycle operations. */
@Injectable()
export class QuizRegistrationService {
  constructor(
    @InjectRepository(QuizRegister)
    private readonly quizRegisterRepository: Repository<QuizRegister>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
  ) {}

  async listRegistrations(quizId: number): Promise<QuizRegistrationDto[]> {
    await this.ensureQuizExists(quizId);
    const registrations = await this.quizRegisterRepository.find({
      where: { quiz: { id: quizId } },
      relations: ['user'],
      order: { id: 'ASC' },
    });

    return registrations.map((registration) =>
      plainToInstance(
        QuizRegistrationDto,
        {
          id: registration.id,
          userId: registration.user.userId,
          username: registration.user.userName,
        },
        { excludeExtraneousValues: true },
      ),
    );
  }

  async registerParticipant(
    quizId: number,
    user: AuthenticatedUser,
  ): Promise<QuizRegistrationDto> {
    const quiz = await this.ensureQuizExists(quizId);

    let registration = await this.quizRegisterRepository.findOne({
      where: {
        quiz: { id: quizId },
        user: { userId: user.userId },
      },
      relations: ['user'],
    });

    if (!registration) {
      registration = this.quizRegisterRepository.create({
        quiz,
        user: { userId: user.userId } as User,
        status: true,
      });
      registration = await this.quizRegisterRepository.save(registration);
    }

    return plainToInstance(
      QuizRegistrationDto,
      {
        id: registration.id,
        userId: user.userId,
        username: user.userName,
      },
      { excludeExtraneousValues: true },
    );
  }

  async unregisterParticipant(quizId: number, user: AuthenticatedUser): Promise<void> {
    await this.ensureQuizExists(quizId);

    const registration = await this.quizRegisterRepository.findOne({
      where: {
        quiz: { id: quizId },
        user: { userId: user.userId },
      },
    });

    if (!registration) {
      return;
    }

    await this.quizRegisterRepository.remove(registration);
  }

  private async ensureQuizExists(quizId: number): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException(`Quiz ${quizId} not found`);
    }
    return quiz;
  }
}
