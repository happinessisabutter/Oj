import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JudgeQueueModule } from '../../libs/infra-queue/judge-queue.module';
import { JudgeLoop } from './judge.loop';
import { JudgeService } from './judge.service';
import { JUDGE_COMMAND_PORT } from '../../port/judge/judge-command.port';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JudgeQueueModule,
  ],
  providers: [
    JudgeLoop,
    JudgeService,
    { provide: JUDGE_COMMAND_PORT, useExisting: JudgeService },
  ],
  exports: [JudgeLoop],
})
export class JudgeWorkerModule {}
