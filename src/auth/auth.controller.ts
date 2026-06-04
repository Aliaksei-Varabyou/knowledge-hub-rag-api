import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60 } })
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    await this.authService.signUp(dto);

    return {
      message: 'User successfully created',
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto) {
    return await this.authService.refresh(dto);
  }

  @Post('logout')
  logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}
