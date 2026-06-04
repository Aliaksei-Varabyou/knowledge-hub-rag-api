import {
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { GeminiService } from 'src/ai/gemini/gemini.service';
import { AppLogger } from 'src/common/logger/logger.service';

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new AppLogger();
  private client: QdrantClient;
  private readonly collectionName: string;

  constructor(
    private readonly config: ConfigService,
    private readonly geminiService: GeminiService,
  ) {
    this.client = new QdrantClient({
      url: this.config.get<string>('RAG_VECTOR_DB_URL'),
    });
    this.collectionName = this.config.get<string>(
      'RAG_VECTOR_COLLECTION',
      'knowledge_hub_articles',
    );
  }

  getClient() {
    return this.client;
  }

  getCollectionName() {
    return this.collectionName;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      this.logger.error({
        message: 'Qdrant operation failed',
        error: error?.message,
        code: error?.code,
        status: error?.status,
      });
      throw new ServiceUnavailableException('Qdrant service unavailable');
    }
  }

  private async initializeCollection() {
    const collections = await this.client.getCollections();

    const exist = collections.collections.some(
      (collection) => collection.name === this.collectionName,
    );
    if (exist) {
      this.logger.log(`Collection "${this.collectionName}" already exists`);
      return;
    }

    const dimensions = await this.geminiService.getEmbeddingsDimensions();
    await this.client.createCollection(this.collectionName, {
      vectors: {
        size: dimensions,
        distance: 'Cosine',
      },
    });
    this.logger.log(
      `Collection "${this.collectionName}" created with dimensions ${dimensions}`,
    );
  }

  async onModuleInit() {
    try {
      await this.client.getCollections();
      await this.initializeCollection();
      this.logger.log('Connected to Qdrant');
    } catch (error) {
      this.logger.error('Failed to connect to Qdrant');
    }
  }
}
