import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { isValidUUID } from 'src/common/utils';
import { removeField } from 'src/common/interceptors/exclude-password.interceptor';
import { User } from 'src/common/types';

@Controller('user')
@UseInterceptors(removeField<User, 'password'>)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    return await this.userService.findAll();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    const user = await this.userService.findByIdOrThrow(id);
    return user;
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Put(':id')
  async updateUserPassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.userService.updatePassword(id, updatePasswordDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.userService.delete(id);
  }
  
}
