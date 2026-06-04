import { validate } from 'class-validator';
import { CreateUserDto } from '../create-user.dto';
import { UpdatePasswordDto } from '../update-password.dto';

describe('CreateUserDto', () => {
  it('Should fail if required fields is missing', async () => {
    const dto = new CreateUserDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
  it('Should fail with short password', async () => {
    const dto = new CreateUserDto();
    dto.login = 'testLogin';
    dto.password = '123';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
  it('Should fail with incorrect role', async () => {
    const dto = new CreateUserDto();
    dto.login = 'testLogin';
    dto.password = '123';
    dto.role = 'role' as any;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'role')).toBe(true);
  });
  it('Should pass with valid data', async () => {
    const dto = new CreateUserDto();
    dto.login = 'testLogin';
    dto.password = '123456';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('UpdatePasswordDto', () => {
  it('Should fail if required fields is missing', async () => {
    const dto = new UpdatePasswordDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
  it('Should pass with valid data', async () => {
    const dto = new UpdatePasswordDto();
    dto.newPassword = 'testLogin';
    dto.oldPassword = '123456';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
