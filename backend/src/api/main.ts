import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { requestIdMiddleware } from '../common/middleware/request-id.middleware';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(requestIdMiddleware);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT || 5000);
}
bootstrap();
