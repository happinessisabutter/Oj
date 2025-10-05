import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { JudgeWorkerModule } from './judge/judge-worker.module';
import { JudgeLoop } from './judge/judge.loop';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(
    JudgeWorkerModule,
    {
      logger: ['error', 'warn'],
    },
  );

  const loop = appContext.get(JudgeLoop);
  await loop.start();
  Logger.log('Judge worker started', 'JudgeWorker');
}

bootstrap().catch((err) => {
  Logger.error('Judge worker failed', err.stack, 'JudgeWorker');
  process.exit(1);
});
