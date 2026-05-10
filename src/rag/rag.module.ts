import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RagService } from './rag.service';
import { QdrantService } from './qdrant.service';
import { RagController } from './rag.controller';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports: [ConfigModule, AiModule],
  providers: [RagService, QdrantService],
  exports: [RagService, QdrantService],
  controllers: [RagController],
})
export class RagModule {}
