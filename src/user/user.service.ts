import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UserRole } from 'src/common/enums';
import { User } from 'src/common/types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ArticleService } from 'src/article/article.service';
import { CommentService } from 'src/comment/comment.service';

@Injectable()
export class UserService {
  private users: User[] = [];
  constructor(
    private articleService: ArticleService,
    private commentService: CommentService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async findByIdOrThrow(id: string): Promise<User | never> {
    const user  = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const user: User = {
      id: randomUUID(),
      login: createUserDto.login,
      password: createUserDto.password,
      role: createUserDto.role ?? UserRole.VIEWER,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    this.users.push(user);
    return user;
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<Omit<User, 'password'>> {
    const user = await this.findByIdOrThrow(id);
    if (user.password !== updatePasswordDto.oldPassword) {
      throw new ForbiddenException('Old password does not match');
    }
    user.password = updatePasswordDto.newPassword;
    user.updatedAt = Date.now();

    return user;
  }

  async delete(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    this.articleService.clearAuthor(id);
    this.commentService.deleteByAuthorId(id);
    this.users = this.users.filter(u => u.id !== id);
  }
}
