import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './api/modules/user/user.module';
import { ProblemModule } from './api/modules/problem/problem.module';
import { QuizModule } from './api/modules/quiz/quiz.module';
import { SubmissionModule } from './api/modules/submission/submission.module';
import { AppDataSource } from './libs/infra-db/data-source';
import { JudgeQueueModule } from './libs/infra-queue/judge-queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Use DataSource configuration
    TypeOrmModule.forRoot(AppDataSource.options),
    JudgeQueueModule,
    UserModule,
    ProblemModule,
    QuizModule,
    SubmissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
