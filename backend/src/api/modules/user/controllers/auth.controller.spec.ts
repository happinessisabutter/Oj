import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    getActiveSessions: jest.fn(),
    deleteAllSessions: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  const userService = {
    create: jest.fn(),
  } as unknown as jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService, userService);
  });

  it('register returns sanitized user dto', async () => {
    const user = {
      userId: 'u-1',
      userName: 'john',
      password: 'hashed',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    (userService.create as any).mockResolvedValue(user);

    const result = await controller.register({
      userName: 'john',
      password: 'password123',
    } as any);

    expect(userService.create).toHaveBeenCalled();
    expect(result).toMatchObject({
      userId: 'u-1',
      userName: 'john',
      role: 'user',
    });
    expect((result as any).password).toBeUndefined();
  });

  it('login forwards user-agent and ip to AuthService', async () => {
    const loginDto = { userName: 'john', password: 'pwd' } as any;
    const req: any = {
      headers: { 'user-agent': 'UA' },
      ip: '1.2.3.4',
      socket: { remoteAddress: '1.2.3.4' },
    };
    (authService.login as any).mockResolvedValue({
      accessToken: 't',
      user: { userId: 'u', userName: 'john', role: 'user' },
    });

    const result = await controller.login(loginDto, req);

    expect(authService.login).toHaveBeenCalledWith(loginDto, 'UA', '1.2.3.4');
    expect(result).toEqual({
      accessToken: 't',
      user: { userId: 'u', userName: 'john', role: 'user' },
    });
  });

  it('logout extracts bearer token and calls service', async () => {
    const req: any = { headers: { authorization: 'Bearer token-123' } };
    await controller.logout({ userId: 'u-1' } as any, req);
    expect(authService.logout).toHaveBeenCalledWith('u-1', 'token-123');
  });
});
