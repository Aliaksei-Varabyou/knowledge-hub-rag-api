import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { UserService } from 'src/user/user.service';
import { Role } from 'src/common/types';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { RefreshDto } from './dto/refresh.dto';
import { ValidationError } from 'src/common/errors/validation.error';
import { ForbiddenError } from 'src/common/errors/forbidden.error';
import { UnauthorizedError } from 'src/common/errors/unauthorized.error';

@Injectable()
export class AuthService {
  private blacklistedTokens = new Set<string>();
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(dto: SignupDto) {
    const { login, password } = dto;

    const userExists = await this.userService.findByLogin(login);
    if (userExists) {
      throw new ValidationError('User already exists');
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
      throw new ForbiddenError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ForbiddenError('Invalid credentials');
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
      throw new UnauthorizedError('No access token provided');
    }
    if (this.blacklistedTokens.has(refreshToken)) {
      throw new ForbiddenError('Token is blacklisted');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_SECRET_REFRESH_KEY'),
      });
    } catch (e) {
      throw new ForbiddenError('Invalid or expired refresh token');
    }

    const user = await this.userService.findById(payload.userId);
    if (!user) {
      throw new ForbiddenError('User not found');
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

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedError('No refresh token');
    }

    this.blacklistedTokens.add(refreshToken);

    return { message: 'Logged out successfully' };
  }
}
