import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JudgeQueueModule } from '../../libs/infra-queue/judge-queue.module';
import { JudgeService } from './service/judge.service';
import { JUDGE_COMMAND_PORT } from '../sandbox/Sandbox.port';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JudgeQueueModule,
  ],
  providers: [
    JudgeService,
    { provide: JUDGE_COMMAND_PORT, useExisting: JudgeService },
  ],
  exports: [JudgeService],
})
export class JudgeWorkerModule {}
