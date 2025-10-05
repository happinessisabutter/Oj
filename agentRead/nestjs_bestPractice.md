# 🧭 NestJS AI Coding Guide (Verified Against Official Docs)

**Purpose:** Ensure AI-generated NestJS code aligns with official conventions: validation, typing, layered modules, Swagger docs, and DI.

---

## ⚙️ Global Application Setup

| Category | Official Practice | AI Code Requirement |
|-----------|------------------|---------------------|
| Application Bootstrap | `NestFactory.create(AppModule)`; set global pipes/filters/interceptors in `main.ts`. | Never use raw `express()`. Configure in `main.ts`. |

| Global Validation | `app.useGlobalPipes(new ValidationPipe({ whitelist:true, transform:true }))` | Every `@Body()` binds to a DTO with class-validator decorators. |

| Required Packages | Install `class-validator` + `class-transformer`. | `npm i class-validator class-transformer` |

| Global Exception Filter | Register via `app.useGlobalFilters(new HttpExceptionFilter())`. | Don’t `try/catch` in controllers for shaping responses. |

| Filter DI Limitation | Global filters registered with `useGlobalFilters()` can’t use DI. | If a filter needs DI, apply locally with `@UseFilters()`. |

| Config Management | `@nestjs/config` → `ConfigModule.forRoot({ isGlobal:true })` + `ConfigService`. | Don’t read `process.env` in business logic. |

| Swagger / OpenAPI | `@nestjs/swagger` (`@ApiTags`, `@ApiProperty`). |  |

| Logging | Use `Logger` from `@nestjs/common`. | Avoid `console.log` in prod code. |

---

## 🧱 Architectural Layers

| Layer | Purpose | AI Enforcement |
|------|---------|----------------|
| Controller | Handles routing; delegates to services. | No DB/business logic in controllers. |
| Service | Business logic. | `@Injectable()`; inject repositories/APIs. |
| Repository | Data access via ORM. | Inject into services only. |
| Module | Groups controllers/providers. | Proper import/export; avoid cycles. |
| DTO | Validated classes (not interfaces). | Use class-validator + `@ApiProperty`. |

---

## 🧩 ValidationPipe — Key Options

- `whitelist`, `forbidNonWhitelisted`, `transform`, `stopAtFirstError`
- `exceptionFactory`, `errorHttpStatusCode`

> DTOs **must be classes**, not interfaces (runtime metadata required).
## DTO mapping guidance:
Use class-transformer and ClassSerializerInterceptor globally; exclude sensitive fields with @Exclude.
---

## 🧠 Exception Filters

- Catch exceptions in **controller context**.
- Global filters can’t DI; local filters can.
- For microservices, use `RpcException` + RPC filters (return Observable).

---

## 🔁 Pipes

- Built-in: `ParseIntPipe`, `ParseUUIDPipe`, `ValidationPipe`.
- Custom pipes implement `PipeTransform` and may throw `BadRequestException`.

---

## 🧩 DTO Best Practices

- Use mapped types: `PartialType`, `PickType`, `OmitType`.
- For nested objects: `@ValidateNested()` + `@Type(() => SubType)`.
- Add Swagger docs with `@ApiProperty()`.

---

## 🧩 Code Style & Structure

- DI only; never `new Service()`.
- Use `async/await`.
- Throw `HttpException` subclasses.
- Strong typing; avoid `any`.
- Files kebab-case; classes PascalCase; JSDoc for exported members.

---

## 🚫 Forbidden

- Raw Express APIs.
- DB access in controller.
- Missing `@Injectable()` on providers.
- Untyped responses / `any`.
- Hardcoded env values.
- Skipping validation decorators.

---

## Example — `main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    stopAtFirstError: true,
  }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder().setTitle('Online Judge API').setVersion('1.0').build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, doc);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 http://localhost:${port}`);
}
bootstrap();
```


---

**Purpose:** Extend baseline rules with production-style components: Guards, Interceptors, Middleware, Queues, Health, Rate Limiting, and Testing.

---

## Guards


- **Definition** Guards implement `CanActivate` and run *before* route handlers.
- Create `@Injectable()` classes implementing `canActivate(context: ExecutionContext)` that return `boolean, Promise<boolean>,  Observable<boolean>`.
- **Applying** Use `@UseGuards(AuthGuard)` at method/class level or `app.useGlobalGuards()`.Never hardcode tokens in controllers.
- **Common Example** JWT auth with Passport → `@UseGuards(AuthGuard('jwt'))`.Ensure auth logic lives in a dedicated `auth` module.


```ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const user = ctx.switchToHttp().getRequest().user;
    return user?.role === 'admin';
  }
}
```

## Interceptors

- Implement NestInterceptor with intercept(context, next) returning an Observable; Use for logging, response mapping, caching, timeouts.

- Global: app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));Avoid modifying business logic inside interceptors.

```ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const now = Date.now();
    return next.handle().pipe(
      tap(() =>
        console.log(`${context.switchToHttp().getRequest().url} – ${Date.now() - now} ms`),
      ),
    );
  }
}
```

# Middleware

- Pre-controller processing (logging, request ID, token extraction).

- Register with configure(consumer: MiddlewareConsumer).

# Queues — Bull / BullMQ

- @nestjs/bull for background jobs.

- BullModule.forRoot(...), BullModule.registerQueue({ name: 'judge' }).

- @Processor('judge') + @Process('evaluate').
- Use queues for asynchronous or retryable tasks (e.g., submission evaluation).
- Avoid long sync loops; always await async work.

```ts
@Processor('judge')
export class JudgeProcessor {
  @Process('evaluate')
  async handle(job: Job<JudgeTaskDto>) {
    // Perform judging logic
  }
}
```

# Health Checks — Terminus

- GET /health with DB checks.

- Keep lightweight and unauthenticated for LB probes.

- Expose GET /health endpoint for load-balancer checks.
- Keep health endpoint lightweight and unauthenticated.
- Use @HealthCheck() decorator + db.pingCheck(), memoryHeapCheck()

# Rate Limiting — Throttler

- ThrottlerModule.forRoot({ ttl:60, limit:10 }).

- Per-route @Throttle(limit, ttl).

# Security & Performance

- Helmet, CORS, Compression.

- Avoid logging secrets.

- Use response envelopes { data, meta }.

# Lifecycle Hooks

- OnModuleInit, OnApplicationShutdown, etc. for boot/shutdown routines.

# Testing Guidelines

- Unit: @nestjs/testing + Jest.

- e2e: 

- Override providers for mocks.


# Centralized error model & Logger.
Error Objects: Always extend HttpException or custom DomainException.Keep error shapes consistent for clients.

---

# Caching & Performance

**Goal:** Use CacheModule/CacheInterceptor, TTL strategies, and lightweight performance enhancements (compression, pagination, selective queries).
if For multiple instances → prefer Redis store.

---

## Setup

```bash
npm i @nestjs/cache-manager cache-manager
npm i cache-manager-redis-yet   # optional for Redis

```
```ts
import { Module, CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [CacheModule.registerAsync({
    useFactory: async () => ({
      store: await redisStore({ ttl: 60, host: 'localhost', port: 6379 }) ///(if use redis),
    }),
    isGlobal: true,
  })],
})
export class AppModule {}
```
## Controller-level Caching

use
- @UseInterceptors(CacheInterceptor)

- @CacheKey('problem-list')

- @CacheTTL(600)

## Service-level Caching
- @Inject(CACHE_MANAGER) private cache: Cache;
// get/set/del with explicit TTL

## Custom Cache Key

Extend CacheInterceptor and override trackBy().

## Store Options

Memory (default), Redis (multi-instance), hybrid L1/L2.

## Performance Techniques

Compression middleware, Helmet, Throttler.

Selective columns with ORM, pagination/cursors, streaming.

## Invalidations

- Explicit cache.del(key) after mutations; cache.reset() on deploy.

Suggested TTLs (OJ System)

Problem list/tags: 10m

Submission history: 1m

Prefer CacheInterceptor for simple GETs, always invalidate after writes.


---

# Interface & Abstraction Standards

**Purpose:** Define where to use interfaces/abstract classes to avoid hard coupling and keep implementations swappable.

---

## Core Principle

> Anything that may change (cloud services, queues, storage, judge logic) must be accessed via an **interface** and injected through DI.

## Must-Abstract Modules

| Layer | Reason     | Interface     | Implementations |
|------ |--------    |-----------    |------------------|
| Cache | swap memory/Redis/Memcached | `ICacheProvider` | `RedisCacheProvider`, `MemoryCacheProvider` |
| Queue | swap Bull/Kafka/RabbitMQ | `IQueueService` | `BullQueueService`|`KafkaQueueService` |
| Storage | local ↔ S3/Blob | `IStorageService` | `LocalStorageService`, `S3StorageService` |
| Judge | multiple sandboxes | `IJudgeAdapter` | `PythonJudgeAdapter`, `CppJudgeAdapter` |
| Repository | ORM swap/mocking | `IUserRepository`, etc. | `UserRepositoryTypeOrm` |
| Auth | JWT/OAuth/SSO | `IAuthService` | `JwtAuthService`, `GoogleAuthService` |
| Notification | email/websocket/kafka | `INotificationService` | `EmailService`, `SocketNotifier` |
| Parser | PDF/CSV/OCR | `IFileParser` | `PdfParser`, `OcrParser` |

## Safe to Hard-Wire

- Pipes, Filters, Swagger, ConfigModule, Controllers/DTOs, Logger/Throttler/Terminus.


## Example Registration

```ts
@Module({
  providers: [{ provide: 'IJudgeAdapter', useClass: PythonJudgeAdapter }],
  exports: ['IJudgeAdapter'],
})
export class JudgeModule {}
```
- Summary: Abstract external or volatile dependencies; keep framework primitives direct.












