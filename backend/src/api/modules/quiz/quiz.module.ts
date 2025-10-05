import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizCategory } from './entities/quiz-category.entity';
import { QuizProblem } from './entities/quiz-problem.entity';
import { QuizRegister } from './entities/quiz-register.entity';
import { QuizRecord } from './entities/quiz-record.entity';
import { QuizService } from './services/quiz.service';
import { QuizProblemSetService } from './services/quiz-problem-set.service';
import { QuizRegistrationService } from './services/quiz-registration.service';
import { QuizRecordService } from './services/quiz-record.service';
import { QuizScoreboardService } from './services/quiz-scoreboard.service';
import { QuizController } from './controllers/quiz.controller';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quiz,
      QuizCategory,
      QuizProblem,
      QuizRegister,
      QuizRecord,
    ]),
  ],
  controllers: [QuizController],
  providers: [
    QuizService,
    QuizProblemSetService,
    QuizRegistrationService,
    QuizRecordService,
    QuizScoreboardService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [QuizService],
})
export class QuizModule {}
