import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { AppLogger } from 'src/common/logger/logger.service';

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new AppLogger();

  private client: QdrantClient;

  constructor(private readonly config: ConfigService) {
    this.client = new QdrantClient({
      url: this.config.get<string>('RAG_VECTOR_DB_URL'),
    });
  }

  getClient() {
    return this.client;
  }

  async onModuleInit() {
    try {
      const collections = await this.client.getCollections();
      this.logger.log(
        `Connected to Qdrant. Collections: ${collections.collections.length}`,
      );
    } catch (error) {
      this.logger.error('Failed to connect to Qdrant');
      throw error;
    }
  }
}
