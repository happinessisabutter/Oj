import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  it('validate returns mapped user payload', async () => {
    const config = { get: jest.fn().mockReturnValue('secret') } as any;
    const strategy = new JwtStrategy(config);
    const result = await strategy.validate({
      userId: 'u',
      userName: 'john',
      role: 'user',
    } as any);
    expect(result).toEqual({ userId: 'u', userName: 'john', role: 'user' });
  });

  it('validate throws when payload missing userId', async () => {
    const config = { get: jest.fn().mockReturnValue('secret') } as any;
    const strategy = new JwtStrategy(config);
    await expect(strategy.validate({} as any)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
