#!/usr/bin/env ts-node

/**
 * User Seeder Script
 *
 * Usage: npm run seed:users
 *
 * This demonstrates using AppDataSource.getRepository() outside NestJS
 */

import {
  AppDataSource,
  initializeDataSource,
} from '../libs/infra-db/data-source';
import { User, UserRole } from '../api/modules/user/entities/user.entity';
import { Session } from '../api/modules/user/entities/session.entity';
import * as bcrypt from 'bcrypt';

async function seedUsers() {
  console.log('🌱 Starting user seeding...');

  try {
    // Initialize DataSource
    await initializeDataSource();

    // Get repositories
    const userRepo = AppDataSource.getRepository(User);
    const sessionRepo = AppDataSource.getRepository(Session);

    // Clean tables for a consistent Postgres dev baseline
    // Clear children first to satisfy FKs, then parents
    if ((await userRepo.count()) > 0) {
      console.log('🧹 Clearing existing users and sessions...');
      await sessionRepo.clear();
      await userRepo.clear();
    }

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const admin = userRepo.create({
      userName: 'admin',
      password: hashedAdminPassword,
      role: UserRole.ADMIN,
    });
    await userRepo.save(admin);
    console.log('✅ Created admin user (username: admin, password: admin123)');

    // Create test users
    const testUsers = [
      { userName: 'testuser1', password: 'password123', role: UserRole.USER },
      { userName: 'testuser2', password: 'password123', role: UserRole.USER },
      {
        userName: 'moderator',
        password: 'password123',
        role: UserRole.MODERATOR,
      },
    ];

    for (const userData of testUsers) {
      const existing = await userRepo.findOne({
        where: { userName: userData.userName },
      });

      if (existing) {
        console.log(
          `⚠️  User ${userData.userName} already exists, skipping...`,
        );
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = userRepo.create({
        ...userData,
        password: hashedPassword,
      });
      await userRepo.save(user);
      console.log(`✅ Created user: ${user.userName}`);
    }

    console.log('\n🎉 Seeding completed successfully!');

    // Close connection
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder
seedUsers();
