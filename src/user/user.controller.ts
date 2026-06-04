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
import { CurrentUserType, User } from 'src/common/types';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/types';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

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

  @Roles(Role.ADMIN, Role.EDITOR)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Roles(Role.ADMIN, Role.EDITOR)
  @Put(':id')
  async updateUserPassword(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.userService.updatePassword(id, updatePasswordDto, user);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.userService.delete(id);
  }
}
