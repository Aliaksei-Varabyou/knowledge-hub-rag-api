import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RagService } from './rag.service';
import { QdrantService } from './qdrant.service';
import { RagController } from './rag.controller';
import { AiModule } from 'src/ai/ai.module';
import { ChunkingService } from './chunking.service';
import { ArticleModule } from 'src/article/article.module';

@Module({
  imports: [ConfigModule, AiModule, ArticleModule],
  providers: [RagService, QdrantService, ChunkingService],
  exports: [RagService, QdrantService],
  controllers: [RagController],
})
export class RagModule {}
