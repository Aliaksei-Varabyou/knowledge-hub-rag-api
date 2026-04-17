import { IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  login: string;
  @IsString()
  @MinLength(6)
  password: string;
}
