import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { User } from 'src/api/modules/user/entities/user.entity';
import { Session } from 'src/api/modules/user/entities/session.entity';
import { CodeTemplate } from 'src/api/modules/problem/entities/code-template.entity';
import { Problem } from 'src/api/modules/problem/entities/problem.entity';
import { Tag } from 'src/api/modules/problem/entities/tag.entity';
import { ProblemCase } from 'src/api/modules/problem/entities/problem-case.entity';
import { ProblemTag } from 'src/api/modules/problem/entities/problem-tag.entity';
import { Language } from 'src/api/modules/problem/entities/language.entity';
import { JudgeCase } from 'src/api/modules/submission/entities/judge-case.entity';
import { Judge } from 'src/api/modules/submission/entities/judge.entity';
import { Quiz } from 'src/api/modules/quiz/entities/quiz.entity';
import { QuizCategory } from 'src/api/modules/quiz/entities/quiz-category.entity';
import { QuizProblem } from 'src/api/modules/quiz/entities/quiz-problem.entity';
import { QuizRegister } from 'src/api/modules/quiz/entities/quiz-register.entity';
import { QuizRecord } from 'src/api/modules/quiz/entities/quiz-record.entity';
import { config } from 'dotenv';

config();
// support change datasource,
// support enable migration and synchronize
// default setting is postgres and sychronize is true

type Driver = 'postgres' | 'sqlite';

// Default behavior: Postgres + synchronize ON for fast development
// Switch MODE to 'migrate' when you want the app to run migrations on init.
// In production, prefer migrations for safety.
const DRIVER_DEFAULT: Driver = 'postgres';
const MODE_DEFAULT: 'sync' | 'migrate' = 'sync';
const isProd = process.env.NODE_ENV === 'production';
const DRIVER_ACTIVE: Driver = DRIVER_DEFAULT;
const MODE_ACTIVE: 'sync' | 'migrate' = isProd ? 'migrate' : MODE_DEFAULT;

function dataSourceConfig(driver: Driver) {
  if (driver === 'sqlite') {
    return {
      type: 'sqlite',
      database: 'tmp/dev.sqlite',
      entities: [
        User,
        Session,
        Problem,
        Tag,
        ProblemCase,
        ProblemTag,
        Language,
        CodeTemplate,
        JudgeCase,
        Judge,
        Quiz,
        QuizCategory,
        QuizProblem,
        QuizRegister,
        QuizRecord,
      ],
      synchronize: true, // In production, consider using migrations instead
      logging:
        process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    } as DataSourceOptions;
  }
  if (driver === 'postgres') {
    const wantMigrate = MODE_ACTIVE === 'migrate';
    const wantSync = MODE_ACTIVE === 'sync';
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
      entities: [
        User,
        Session,
        CodeTemplate,
        Problem,
        Tag,
        ProblemCase,
        ProblemTag,
        Language,
        JudgeCase,
        Judge,
        Quiz,
        QuizCategory,
        QuizProblem,
        QuizRegister,
        QuizRecord,
      ],
      migrations: ['dist/migrations/**/*.js'],
      migrationsTableName: 'migrations',
      migrationsRun: wantMigrate,
      synchronize: wantMigrate ? false : wantSync,
      logging:
        process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
      extra: { max: 10, min: 2 },
    } as DataSourceOptions;
  }
  throw new Error(`Unsupported DB_TYPE: ${driver}`);
}

const buildOptions = (): DataSourceOptions => {
  return dataSourceConfig(DRIVER_ACTIVE);
};

/**
 * TypeORM DataSource Configuration
 * Pattern used in the official TypeORM tutorial: https://typeorm.io/data-source
 * - NestJS TypeORM integration
 * - CLI migrations (typeorm migration:run, etc.)
 * - Direct database access in scripts
 * - Testing with different configurations
 */
export const AppDataSource = new DataSource(buildOptions());

/**
 * Initialize DataSource
 * Call this before using AppDataSource.getRepository()
 */
export const initializeDataSource = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    const driver = AppDataSource.options.type;

    console.log(`✅ DataSource initialized (${String(driver)})`);
  }
  return AppDataSource;
};

/**
 * Example: Get repository directly
 * Usage in services or scripts:
 *
 * import { AppDataSource } from '../data-source';
 * const userRepo = AppDataSource.getRepository(User);
 * const users = await userRepo.find();
 */

// keep file minimal: single source of truth for DataSource options
