import { UserController } from './user.controller';
import { UserService } from '../services/user.service';

describe('UserController', () => {
  let controller: UserController;
  const userService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UserController(userService);
  });

  it('findAll returns PaginatedResponse with sanitized users', async () => {
    const users = [
      {
        userId: '1',
        userName: 'a',
        role: 'user',
        password: 'x',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: '2',
        userName: 'b',
        role: 'admin',
        password: 'y',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (userService.findAll as any).mockResolvedValue({ users, total: 2 });

    const page = 1,
      pageSize = 10;
    const res = await controller.findAll({ page, pageSize } as any);

    expect(userService.findAll).toHaveBeenCalledWith({ page, pageSize });
    expect(res.meta.total).toBe(2);
    expect(res.meta.page).toBe(1);
    expect(res.meta.pageSize).toBe(10);
    expect(res.data.length).toBe(2);
    expect((res.data[0] as any).password).toBeUndefined();
  });

  it('findOne returns sanitized user DTO', async () => {
    const user = {
      userId: '1',
      userName: 'a',
      role: 'user',
      password: 'x',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (userService.findById as any).mockResolvedValue(user);

    const res = await controller.findOne('1');
    expect(userService.findById).toHaveBeenCalledWith('1');
    expect(res).toMatchObject({ userId: '1', userName: 'a', role: 'user' });
    expect((res as any).password).toBeUndefined();
  });

  it('update returns sanitized user DTO', async () => {
    const updated = {
      userId: '1',
      userName: 'a2',
      role: 'user',
      password: 'x',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (userService.update as any).mockResolvedValue(updated);

    const res = await controller.update('1', { userName: 'a2' } as any);
    expect(userService.update).toHaveBeenCalledWith('1', { userName: 'a2' });
    expect(res).toMatchObject({ userId: '1', userName: 'a2' });
    expect((res as any).password).toBeUndefined();
  });

  it('remove calls service delete', async () => {
    await controller.remove('1');
    expect(userService.delete).toHaveBeenCalledWith('1');
  });
});
