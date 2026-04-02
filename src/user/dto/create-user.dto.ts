import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from "src/common/enums";

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  login: string;
  @IsNotEmpty()
  @IsString()
  password: string;
  @IsEnum(UserRole)
  role?: UserRole;
}
