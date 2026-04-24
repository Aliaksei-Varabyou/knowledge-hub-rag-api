import { validate } from 'class-validator';
import { LoginDto } from '../login.dto';
import { SignupDto } from '../signup.dto';
import { RefreshDto } from '../refresh.dto';

describe('LoginDto', () => {
  it('Should fail if required fields is missing', async () => {
    const dto = new LoginDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
  it('Should fail with short password', async () => {
    const dto = new LoginDto();
    dto.login = 'testLogin';
    dto.password = '123';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
  it('Should pass with valid data', async () => {
    const dto = new LoginDto();
    dto.login = 'testLogin';
    dto.password = '123456';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('SignupDto', () => {
  it('Should fail if required fields is missing', async () => {
    const dto = new SignupDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
  it('Should fail with short password', async () => {
    const dto = new SignupDto();
    dto.login = 'testLogin';
    dto.password = '123';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
  it('Should pass with valid data', async () => {
    const dto = new SignupDto();
    dto.login = 'testLogin';
    dto.password = '123456';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('RefreshDto', () => {
  it('Should fail if required fields is missing', async () => {
    const dto = new RefreshDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
  it('Should pass with valid data', async () => {
    const dto = new RefreshDto();
    dto.refreshToken = 'refreshtoken';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
