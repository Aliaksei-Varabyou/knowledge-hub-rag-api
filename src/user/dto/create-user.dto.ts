import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from 'generated/prisma/enums';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  login: string;
  @IsNotEmpty()
  @IsString()
  password: string;
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
