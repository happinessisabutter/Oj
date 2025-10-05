import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { PaginateDto } from 'src/common/dto/paginate.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcrypt';

/**
 * @description User service: Basic CRUD operations with pagination
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find all users with pagination
   */
  async findAll(
    paginateDto: PaginateDto,
  ): Promise<{ users: User[]; total: number }> {
    const { page, pageSize } = paginateDto;

    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
      select: ['userId', 'userName', 'role', 'createdAt', 'updatedAt'],
    });

    return { users, total };
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId },
      select: ['userId', 'userName', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Find user by username (for authentication)
   */
  async findByUserName(userName: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { userName },
    });
  }

  /**
   * Create new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...userData } = createUserDto;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  /**
   * Update user
   */
  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  /**
   * Delete user
   */
  async delete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    await this.userRepository.remove(user);
  }

  /**
   * Count total users
   */
  async count(): Promise<number> {
    return this.userRepository.count();
  }
}
