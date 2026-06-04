import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from 'src/common/types';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  login: string;
  @IsNotEmpty()
  @MinLength(6)
  @IsString()
  password: string;
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
