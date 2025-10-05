# TypeORM DataSource Guide

## Overview

This project now uses TypeORM's `DataSource` class for database configuration, which is the **official recommended approach** by TypeORM.

## Why DataSource?

### Benefits ✅
1. **CLI Support**: Run TypeORM migrations and commands
2. **Reusability**: Use same config in NestJS, scripts, and tests
3. **Type Safety**: Better TypeScript integration
4. **Testing**: Easy to create test-specific DataSource
5. **Scripts & Seeders**: Access DB outside NestJS context

### Comparison

**Before (NestJS only):**
```typescript
TypeOrmModule.forRootAsync({
  useFactory: () => ({ type: 'postgres', ... })
})
```
- ❌ Can't run `typeorm migration:run`
- ❌ Can't access DB in scripts
- ❌ Hard to test with different configs

**After (DataSource):**
```typescript
// src/data-source.ts
export const AppDataSource = new DataSource({...})

// app.module.ts
TypeOrmModule.forRoot(AppDataSource.options)
```
- ✅ Full CLI support
- ✅ Reusable everywhere
- ✅ Easy testing

---

## File Structure

```
backend/src/
├── data-source.ts                          # ← DataSource configuration
├── app.module.ts                           # Uses AppDataSource.options
├── migrations/                             # TypeORM migrations
│   └── *.ts
├── scripts/
│   └── seed-users.ts                       # Example script using DataSource
└── modules/
    └── user/
        └── services/
            ├── user.service.ts             # Uses @InjectRepository (RECOMMENDED)
            └── user-datasource.example.ts  # Example using AppDataSource
```

---

## Usage Patterns

### 1. In NestJS Services (RECOMMENDED)

**Use `@InjectRepository()` for services:**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepository.find();
  }
}
```

**Why?**
- ✅ NestJS handles dependency injection
- ✅ Easy to mock in tests
- ✅ Proper lifecycle management
- ✅ Cleaner code

---

### 2. In Scripts & Seeders

**Use `AppDataSource.getRepository()` for standalone scripts:**

```typescript
import { AppDataSource, initializeDataSource } from './data-source';
import { User } from './modules/user/entities/user.entity';

async function seedUsers() {
  // Initialize DataSource
  await initializeDataSource();

  // Get repository
  const userRepo = AppDataSource.getRepository(User);

  // Use it
  const users = await userRepo.find();
  console.log('Users:', users.length);

  // Close when done
  await AppDataSource.destroy();
}

seedUsers();
```

**Example script:** `src/scripts/seed-users.ts`

---

### 3. In Migrations

TypeORM migrations automatically use DataSource:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenToSession1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sessions ADD COLUMN token TEXT NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sessions DROP COLUMN token
    `);
  }
}
```

---

### 4. In Tests

**For unit tests (service tests):**
```typescript
// Use mocked repositories (same as before)
const mockRepository = {
  find: jest.fn(),
  save: jest.fn(),
};

TestingModule.create({
  providers: [
    UserService,
    { provide: getRepositoryToken(User), useValue: mockRepository },
  ],
});
```

**For integration tests:**
```typescript
import { DataSource } from 'typeorm';

const testDataSource = new DataSource({
  type: 'postgres',
  database: 'test_db',
  entities: [User, Session],
  synchronize: true,
});

await testDataSource.initialize();
// Run tests...
await testDataSource.destroy();
```

---

## Available Commands

### Migration Commands

```bash
# Before running CLI against Postgres set (PowerShell example):
$Env:DB_TYPE='postgres'
$Env:DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require'

# Regenerate compiled datasource
npm run build

# Generate migration from entity changes (two options)

# 1) Auto-named file (convenience):
npm run migration:generate

# 2) Manually named file:
npm run migration:gen -- src/migrations/AddTokenColumn

# Create empty migration (manual name only)
npm run migration:create -- src/migrations/AddIndex

# Run pending migrations (rebuilds automatically)
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

> CLI commands operate via the CommonJS wrapper `typeorm-cli-data-source.js`
> (which pulls in the compiled datasource from `dist/libs/`).
> The datasource itself points the migrations glob at `dist/migrations/**/*.js`, so
> everything the CLI loads is already compiled JavaScript. Each command runs
> `npm run build` first to ensure those artifacts exist and match your entities.

### Why a dedicated CLI datasource?

- The application imports the named `AppDataSource` from `src/libs/data-source.ts`.
- TypeORM's CLI requires the module passed via `-d` to expose exactly **one** `DataSource`.
- To avoid refactoring application imports, `src/libs/typeorm-cli-data-source.ts` simply re-exports
  the same instance as the default export. The CLI build targets that wrapper, so migrations and
  runtime code share a single `AppDataSource` while staying configuration-friendly.


### Schema Commands (Development Only)

```bash
# Sync schema (DANGEROUS - only in dev!)
npm run schema:sync

# Drop all tables (DANGEROUS!)
npm run schema:drop
```

### Seeder Commands

```bash
# Run user seeder
npm run seed:users
```

---

## Configuration

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Optional
NODE_ENV=development
```

### DataSource Options

Located in `src/data-source.ts`:

```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  
  // Entities (explicit list)
  entities: [User, Session],
  
  // Migrations
  migrations: ['src/migrations/**/*.ts'],
  migrationsTableName: 'migrations',
  
  // Development settings
  synchronize: false,  // NEVER true in production!
  logging: ['query', 'error'],
  
  // Connection pool
  extra: {
    max: 10,
    min: 2,
  },
});
```

---

## Best Practices

### ✅ DO

1. **Use `@InjectRepository()` in services**
   ```typescript
   constructor(
     @InjectRepository(User)
     private readonly userRepo: Repository<User>
   ) {}
   ```

2. **Use `AppDataSource.getRepository()` in scripts**
   ```typescript
   const userRepo = AppDataSource.getRepository(User);
   ```

3. **Always use migrations in production**
   ```bash
   npm run migration:run
   ```

4. **Initialize DataSource in scripts**
   ```typescript
   await initializeDataSource();
   ```

### ❌ DON'T

1. **Don't use `synchronize: true` in production**
   ```typescript
   synchronize: false, // Always!
   ```

2. **Don't mix @InjectRepository and AppDataSource in services**
   ```typescript
   // ❌ Bad
   const userRepo = AppDataSource.getRepository(User);
   
   // ✅ Good
   constructor(@InjectRepository(User) private userRepo: Repository<User>) {}
   ```

3. **Don't forget to destroy DataSource in scripts**
   ```typescript
   await AppDataSource.destroy();
   ```

---

## Troubleshooting

### DataSource not initialized

```typescript
Error: DataSource is not initialized
```

**Solution:**
```typescript
await initializeDataSource();
```

### Entity not found

```typescript
Error: No metadata for "User" was found
```

**Solution:** Add entity to `data-source.ts`:
```typescript
entities: [User, Session, YourEntity],
```

### trasaction rollback
```typescript
import { getConnection } from "typeorm";

async function performTransactionalOperation() {
    const connection = getConnection();
    await connection.transaction(async transactionalEntityManager => {
        // Perform database operations using transactionalEntityManager
        await transactionalEntityManager.save(SomeEntity, someData);
        await transactionalEntityManager.update(AnotherEntity, { id: 1 }, { name: "New Name" });

        // If an error occurs here, the transaction will automatically roll back
        // For example: throw new Error("Something went wrong!");
    });
}
```

### Migration not running

```bash
npm run migration:run
# Check if DATABASE_URL is set
echo $DATABASE_URL
```

---

## Migration Workflow

### 1. Create Entity Changes

```typescript
// user.entity.ts
@Column({ type: 'varchar', nullable: true })
phoneNumber?: string;
```

### 2. Generate Migration

```bash
npm run migration:generate -- src/migrations/AddPhoneNumber
```

### 3. Review Migration

```typescript
// src/migrations/1234567890-AddPhoneNumber.ts
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE users ADD COLUMN phone_number VARCHAR
  `);
}
```

### 4. Run Migration

```bash
npm run migration:run
```

### 5. Rollback if Needed

```bash
npm run migration:revert
```

---

## SQLite Workflow (Dev & Tests)

Use SQLite when you need a disposable datastore for development spikes or integration tests without touching Postgres.

### Key Files
- `backend/src/libs/data-source.ts` – single dynamic DataSource (Postgres or SQLite)
- `backend/src/scripts/seed-sqlite-users.ts` – reseeds the SQLite database with default accounts

### Quick Start
```bash
# Seed a local SQLite file (defaults to tmp/dev.sqlite)
npm run seed:sqlite

# Override the location if you want a per-branch DB
SQLITE_DB_PATH=.tmp/my-branch.sqlite npm run seed:sqlite
```

### Testing Helpers
- `initializeDataSource` – initializes the dynamic DataSource based on env (`DB_TYPE=sqlite` for SQLite)
- For in-memory tests, set `SQLITE_DB_PATH=':memory:'` before initializing

> **Tip:** The helper ensures the target directory exists, so you can safely point to paths such as `.tmp/sqlite/dev.sqlite` without pre-creating directories.

---

## Postgres Dev Cleanup

For development, the Postgres seeder now clears tables directly using repositories (no separate cleanup script needed):

```bash
npm run seed:users
```

The script wipes `sessions` first, then `users`, and inserts default accounts. For SQLite, use `npm run seed:sqlite`.

---

## Summary

| Use Case | Method | Example |
|----------|--------|---------|
| **NestJS Services** | `@InjectRepository()` | `user.service.ts` |
| **Scripts/Seeders** | `AppDataSource.getRepository()` | `seed-users.ts` |
| **Migrations** | Automatic via CLI | `npm run migration:run` |
| **Tests (Unit)** | Mock repositories | `user.service.spec.ts` |
| **Tests (Integration)** | Test DataSource | Custom DataSource |

---

## Dev Sync vs Migrations

You can prepare the schema two ways during development:

- `prepareSchema('sync')` (development only)
  - Creates/updates tables to match entities using `synchronize()`.
  - Fast for iterating on new entities. Never use in production.

- `prepareSchema('migrate')` (recommended / production-safe)
  - Applies pending migrations using `runMigrations()`.

Usage (script example):

```ts
import { prepareSchema } from '../libs/data-source';

// Dev: create tables step-by-step
await prepareSchema('sync');

// Prod/CI: apply migrations
await prepareSchema('migrate');
```

SQLite alternative for quick tests:

```ts
import { createSqliteDataSource } from '../libs/data-source';

const ds = createSqliteDataSource(':memory:');
await ds.initialize();
// ... use ds.getRepository(...)
await ds.destroy();
```

## Example Files

- ✅ `src/data-source.ts` - DataSource configuration
- ✅ `src/scripts/seed-users.ts` - Seeder example
- ✅ `src/modules/user/services/user-datasource.example.ts` - Direct usage example
- ✅ `src/modules/user/services/user.service.ts` - NestJS service example

---

## Related Documentation

- [TypeORM DataSource API](https://typeorm.io/data-source)
- [TypeORM Migrations](https://typeorm.io/migrations)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)
