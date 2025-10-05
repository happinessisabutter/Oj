import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionController } from './controllers/submission.controller';
import { SubmissionService } from './services/submission.service';
import { SubmissionProgressService } from './services/progress.service';
import { Judge } from './entities/judge.entity';
import { JudgeCase } from './entities/judge-case.entity';
import { Problem } from '../problem/entities/problem.entity';
import { QuizRecord } from '../quiz/entities/quiz-record.entity';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Judge, JudgeCase, Problem, QuizRecord])],
  controllers: [SubmissionController],
  providers: [SubmissionService, SubmissionProgressService, JwtAuthGuard],
  exports: [SubmissionService, SubmissionProgressService],
})
export class SubmissionModule {}
