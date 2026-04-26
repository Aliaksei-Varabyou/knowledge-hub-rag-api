import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PrismaService } from 'prisma/prisma.service';
import { User } from 'generated/prisma/client';
import { CurrentUserType, Role } from 'src/common/types';
import { ForbiddenError } from 'src/common/errors/forbidden.error';
import { NotFoundError } from 'src/common/errors/not-found.error';

const returnedUser = {
  id: true,
  login: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<UserWithoutPassword[]> {
    return this.prisma.user.findMany({
      select: returnedUser,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { login } });
  }

  async findByIdOrThrow(id: string): Promise<User | never> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID "${id}" not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    return this.prisma.user.create({
      data: {
        login: createUserDto.login,
        password: createUserDto.password,
        role: createUserDto.role ?? Role.VIEWER,
      },
      select: returnedUser,
    });
  }

  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
    currentUser: CurrentUserType,
  ): Promise<UserWithoutPassword> {
    const user = await this.findByIdOrThrow(id);
    if (user.role === Role.EDITOR && currentUser.userId !== user.id) {
      throw new ForbiddenError('Editor can update only own resources');
    }
    if (user.password !== updatePasswordDto.oldPassword) {
      throw new ForbiddenError('Old password does not match');
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        password: updatePasswordDto.newPassword,
      },
      select: returnedUser,
    });
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundError(`User with ID "${id}" not found`);
    }
  }
}
