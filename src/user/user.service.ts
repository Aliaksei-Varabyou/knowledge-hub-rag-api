import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/common/types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Role } from 'generated/prisma/enums';

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

  async findById(id: string): Promise<User | undefined> {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdOrThrow(id: string): Promise<User | never> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
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
  ): Promise<UserWithoutPassword> {
    const user = await this.findByIdOrThrow(id);
    if (user.password !== updatePasswordDto.oldPassword) {
      throw new ForbiddenException('Old password does not match');
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
    await this.findByIdOrThrow(id);
    this.prisma.$transaction(async (tx) => {
      await tx.article.updateMany({
        where: { authorId: id },
        data: { authorId: null },
      });

      await tx.comment.deleteMany({
        where: { authorId: id },
      });

      return await tx.user.delete({
        where: { id },
      });
    });
  }
}
