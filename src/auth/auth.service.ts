import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { UserService } from 'src/user/user.service';
import { Role } from 'generated/prisma/enums';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

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

  async login(dto: LoginDto) {
    const { login, password } = dto;

    const user = await this.userService.findByLogin(login);
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ForbiddenException('Invalid credentials');
    }

    const payload = {
      userId: user.id,
      login: user.login,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET_KEY'),
      expiresIn: this.config.get<number>('JWT_ACCESS_TTL'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET_REFRESH_KEY'),
      expiresIn: this.config.get<number>('JWT_REFRESH_TTL'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(dto: RefreshDto) {
    const { refreshToken } = dto;
    if (!refreshToken) {
      throw new UnauthorizedException('No access token proveded');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_SECRET_REFRESH_KEY'),
      });
    } catch (e) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const user = await this.userService.findById(payload.id);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const newPayload = {
      userId: user.id,
      login: user.login,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(newPayload, {
      secret: this.config.get<string>('JWT_SECRET_KEY'),
      expiresIn: this.config.get<number>('JWT_ACCESS_TTL'),
    });
    const newRefreshToken = await this.jwtService.signAsync(newPayload, {
      secret: this.config.get<string>('JWT_SECRET_REFRESH_KEY'),
      expiresIn: this.config.get<number>('JWT_REFRESH_TTL'),
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
