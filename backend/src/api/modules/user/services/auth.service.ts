import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { LoginDto } from '../dto/login.dto';
import { UserService } from './user.service';

export interface JwtPayload {
  userId: string;
  userName: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    userId: string;
    userName: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Login user and create session
   */
  async login(
    loginDto: LoginDto,
    userAgent: string,
    ip: string,
  ): Promise<LoginResponse> {
    const { userName, password } = loginDto;

    // Find user with password
    const user = await this.userService.findByUserName(userName);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      userId: user.userId,
      userName: user.userName,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Create session
    await this.createSession(user.userId, accessToken, userAgent, ip);

    return {
      accessToken,
      user: {
        userId: user.userId,
        userName: user.userName,
        role: user.role,
      },
    };
  }

  /**
   * Logout user (delete session)
   */
  async logout(userId: string, token: string): Promise<void> {
    await this.sessionRepository.delete({ userId, token });
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(userId: string): Promise<User> {
    return this.userService.findById(userId);
  }

  /**
   * Create session record
   */
  private async createSession(
    userId: string,
    token: string,
    userAgent: string,
    ip: string,
  ): Promise<Session> {
    const session = this.sessionRepository.create({
      userId,
      token,
      userAgent,
      ip,
    });

    return this.sessionRepository.save(session);
  }

  /**
   * Delete all sessions for a user
   */
  async deleteAllSessions(userId: string): Promise<void> {
    await this.sessionRepository.delete({ userId });
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
