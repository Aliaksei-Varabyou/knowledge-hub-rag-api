import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RagService } from './rag.service';
import { QdrantService } from './qdrant.service';

@Module({
  imports: [ConfigModule],
  providers: [RagService, QdrantService],
  exports: [RagService, QdrantService],
})
export class RagModule {}
