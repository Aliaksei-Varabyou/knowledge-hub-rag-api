import * as bcrypt from 'bcrypt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { UserService } from 'src/user/user.service';
import { Role } from 'generated/prisma/enums';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async signUp(dto: SignupDto) {
    const { login, password } = dto;

    const userExists = await this.userService.findByLogin(login);
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hash = await bcrypt.hash(password, 10);

    await this.userService.create({
      login,
      password: hash,
      role: Role.VIEWER,
    });
  }
}
