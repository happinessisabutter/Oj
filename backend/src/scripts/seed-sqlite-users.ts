#!/usr/bin/env ts-node

import * as bcrypt from 'bcrypt';
import {
  initializeDataSource,
  AppDataSource,
} from '../libs/infra-db/data-source';
import { User, UserRole } from '../api/modules/user/entities/user.entity';
import { Session } from '../api/modules/user/entities/session.entity';

const log = console.log;
const error = console.error;

const defaultUsers = [
  { userName: 'admin', password: 'admin123', role: UserRole.ADMIN },
  { userName: 'moderator', password: 'password123', role: UserRole.MODERATOR },
  { userName: 'testuser1', password: 'password123', role: UserRole.USER },
  { userName: 'testuser2', password: 'password123', role: UserRole.USER },
];

async function seedSqliteUsers() {
  const sqlitePath = process.env.SQLITE_DB_PATH || 'tmp/dev.sqlite';
  log(`🌱 Using SQLite database: ${sqlitePath}`);

  // Use unified DataSource (set DB_TYPE=sqlite via env or just rely on default here)
  process.env.DB_TYPE = 'sqlite';
  process.env.SQLITE_DB_PATH = sqlitePath;
  const dataSource = await initializeDataSource();

  try {
    const userRepo = dataSource.getRepository(User);
    const sessionRepo = dataSource.getRepository(Session);

    // Clear existing data for a consistent developer experience
    await sessionRepo.clear();
    await userRepo.clear();

    for (const userData of defaultUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = userRepo.create({
        userName: userData.userName,
        password: hashedPassword,
        role: userData.role,
      });
      await userRepo.save(user);
      log(`✅ Created user: ${user.userName}`);
    }

    log('\n🎉 SQLite seeding completed successfully!');
  } catch (err) {
    error('❌ SQLite seeding failed:', err);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seedSqliteUsers();
