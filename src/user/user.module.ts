import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ArticleModule } from 'src/article/article.module';
import { CommentModule } from 'src/comment/comment.module';

@Module({
  imports: [ArticleModule, CommentModule],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
