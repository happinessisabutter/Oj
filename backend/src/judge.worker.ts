import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { JudgeWorkerModule } from './judgeWorkers/judge/judge-worker.module';
import { JudgeRunner } from './judgeWorkers/judge/judge.runner';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(
    JudgeWorkerModule,
    {
      logger: ['error', 'warn'],
    },
  );

  const runner = appContext.get(JudgeRunner);
  await runner.start();
  Logger.log('Judge worker started', 'JudgeWorker');
}

bootstrap().catch((err) => {
  Logger.error('Judge worker failed', err.stack, 'JudgeWorker');
  process.exit(1);
});
