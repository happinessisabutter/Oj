import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto validation', () => {
  it('accepts valid payload', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      userName: 'john',
      password: 'password123',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('rejects missing userName', async () => {
    const dto = Object.assign(new CreateUserDto(), { password: 'password123' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects short password', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      userName: 'john',
      password: 'short',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
