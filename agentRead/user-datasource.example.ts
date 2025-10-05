import { Injectable } from '@nestjs/common';
import { AppDataSource } from '../backend/src/libs/data-source'; 
import { User } from '../backend/src/modules/user/entities/user.entity';

/**
 * EXAMPLE: Alternative UserService using AppDataSource.getRepository()
 * 
 * This demonstrates how to use TypeORM DataSource directly instead of @InjectRepository
 * 
 * When to use AppDataSource.getRepository():
 * - In scripts/seeders outside NestJS context
 * - In migrations
 * - When you need direct database access
 * - Testing with different DataSource configurations
 * 
 * When to use @InjectRepository() (RECOMMENDED for services):
 * - In NestJS services (better for DI and testing)
 * - When you want NestJS to handle lifecycle
 * - Standard application codes
 */
@Injectable()
export class UserDataSourceExample {
  /**
   * Get repository directly from DataSource
   * NOTE: DataSource must be initialized first!
   */
  private getUserRepository() {
    return AppDataSource.getRepository(User);
  }

  /**
   * Example: Find all users using DataSource
   */
  async findAll() {
    const userRepo = this.getUserRepository();
    return userRepo.find();
  }

  /**
   * Example: Find user by ID using DataSource
   */
  async findById(userId: string) {
    const userRepo = this.getUserRepository();
    return userRepo.findOne({ where: { userId } });
  }

  /**
   * Example: Create user using DataSource
   */
  async create(userData: Partial<User>) {
    const userRepo = this.getUserRepository();
    const user = userRepo.create(userData);
    return userRepo.save(user);
  }

  /**
   * Example: Using QueryBuilder with DataSource
   */
  async findActiveUsers() {
    const userRepo = this.getUserRepository();
    
    return userRepo
      .createQueryBuilder('user')
      .where('user.createdAt > :date', { date: new Date('2024-01-01') })
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }
}

/**
 * STANDALONE SCRIPT EXAMPLE
 * Usage outside NestJS (e.g., in a seeder script)
 */
export async function seedUsers() {
  // Initialize DataSource if not already initialized
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);

  const users = [
    { userName: 'admin', password: 'hashed123', role: 'admin' },
    { userName: 'user1', password: 'hashed456', role: 'user' },
  ];

  for (const userData of users) {
    const user: User = userRepo.create(userData as Partial<User>);
    await userRepo.save(user);
    console.log(`Created user: ${user.userName}`);
  }

  console.log('✅ Seeding complete');
}

/**
 * COMPARISON:
 * 
 * // With @InjectRepository (RECOMMENDED for services)
 * constructor(
 *   @InjectRepository(User)
 *   private readonly userRepository: Repository<User>
 * ) {}
 * 
 * // With AppDataSource (for scripts/migrations)
 * const userRepo = AppDataSource.getRepository(User);
 */

