import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { Session } from '../entities/session.entity';
import { User, UserRole } from '../entities/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let sessionRepository: Repository<Session>;

  const mockUser: User = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    userName: 'testuser',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };

  const mockUserService = {
    findByUserName: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Session),
          useValue: mockSessionRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    sessionRepository = module.get<Repository<Session>>(
      getRepositoryToken(Session),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = { userName: 'testuser', password: 'password123' };
    const userAgent = 'Mozilla/5.0';
    const ip = '127.0.0.1';

    it('should login user and return access token', async () => {
      const accessToken = 'jwt-token';
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      mockUserService.findByUserName.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(accessToken);
      mockSessionRepository.create.mockReturnValue({});
      mockSessionRepository.save.mockResolvedValue({});

      const result = await service.login(loginDto, userAgent, ip);

      expect(result).toEqual({
        accessToken,
        user: {
          userId: mockUser.userId,
          userName: mockUser.userName,
          role: mockUser.role,
        },
      });
      expect(mockUserService.findByUserName).toHaveBeenCalledWith(
        loginDto.userName,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: mockUser.userId,
        userName: mockUser.userName,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserService.findByUserName.mockResolvedValue(null);

      await expect(service.login(loginDto, userAgent, ip)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      mockUserService.findByUserName.mockResolvedValue(mockUser);

      await expect(service.login(loginDto, userAgent, ip)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should delete session', async () => {
      const userId = mockUser.userId;
      const token = 'jwt-token';

      mockSessionRepository.delete.mockResolvedValue({ affected: 1 });

      await service.logout(userId, token);

      expect(mockSessionRepository.delete).toHaveBeenCalledWith({
        userId,
        token,
      });
    });
  });

  describe('validateToken', () => {
    it('should validate and return payload', async () => {
      const token = 'valid-token';
      const payload = {
        userId: mockUser.userId,
        userName: mockUser.userName,
        role: mockUser.role,
      };

      mockJwtService.verify.mockReturnValue(payload);

      const result = await service.validateToken(token);

      expect(result).toEqual(payload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const token = 'invalid-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser(mockUser.userId);

      expect(result).toEqual(mockUser);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockUser.userId);
    });
  });

  describe('deleteAllSessions', () => {
    it('should delete all sessions for a user', async () => {
      const userId = mockUser.userId;

      mockSessionRepository.delete.mockResolvedValue({ affected: 3 });

      await service.deleteAllSessions(userId);

      expect(mockSessionRepository.delete).toHaveBeenCalledWith({ userId });
    });
  });

  describe('getActiveSessions', () => {
    it('should return active sessions', async () => {
      const userId = mockUser.userId;
      const sessions = [
        { id: 1, userId, token: 'token1' },
        { id: 2, userId, token: 'token2' },
      ];

      mockSessionRepository.find.mockResolvedValue(sessions);

      const result = await service.getActiveSessions(userId);

      expect(result).toEqual(sessions);
      expect(mockSessionRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
