import { Injectable, NotFoundException } from '@nestjs/common';
import { GeminiService } from 'src/ai/gemini/gemini.service';
import { ArticleService } from 'src/article/article.service';
import { ChunkingService } from './chunking.service';
import { QdrantService } from './qdrant.service';
import { ReindexRequestDto } from './dto/reindex-request.dto';
import { ArticleStatus, ConversationMessage } from 'src/common/types';
import { RagSearchRequestDto } from './dto/rag-search-request.dto';
import { RagChatRequestDto } from './dto/rag-chat-request.dto';
import { buildRagChatPrompt } from './prompts/rag-chat.prompt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RagService {
  private readonly conversations = new Map<string, ConversationMessage[]>();
  constructor(
    private readonly geminiService: GeminiService,
    private readonly articleService: ArticleService,
    private readonly chunkingService: ChunkingService,
    private readonly qdrantService: QdrantService,
    private readonly config: ConfigService,
    private readonly maxConversationMessages: number,
  ) {
    this.maxConversationMessages = this.config.get<number>(
      'RAG_CONVERSATION_MAX_MESSAGES',
      20,
    );
  }

  private async getArticlesForIndexing(dto: ReindexRequestDto) {
    if (dto.articleIds?.length) {
      return this.articleService.findManyByIds(dto.articleIds);
    }

    const result = await this.articleService.findAll({
      status: dto.onlyPublished ? ArticleStatus.PUBLISHED : undefined,
    });

    return result.data;
  }

  async indexArticles(dto: ReindexRequestDto) {
    const articles = await this.getArticlesForIndexing(dto);
    const client = this.qdrantService.getClient();
    const collectionName = this.qdrantService.getCollectionName();

    let indexedChunks = 0;

    for (const article of articles) {
      const chunks = this.chunkingService.chunkText(article.content);

      const points = await Promise.all(
        chunks.map(async (chunk, index) => {
          const embedding = await this.geminiService.generateEmbeddings(chunk);

          indexedChunks++;

          return {
            id: crypto.randomUUID(),

            vector: embedding,

            payload: {
              articleId: article.id,
              articleTitle: article.title,
              chunk,
              chunkIndex: index,
              status: article.status,
              categoryId: article.categoryId,
              updatedAt: article.updatedAt,
            },
          };
        }),
      );

      await client.upsert(collectionName, {
        wait: true,
        points,
      });
    }

    return {
      indexedArticles: articles.length,
      indexedChunks,
      vectorCollection: collectionName,
    };
  }

  async deleteArticleVectors(articleId: string) {
    const client = this.qdrantService.getClient();
    const collectionName = this.qdrantService.getCollectionName();

    const existing = await client.scroll(collectionName, {
      filter: {
        must: [
          {
            key: 'articleId',
            match: {
              value: articleId,
            },
          },
        ],
      },
      limit: 1,
    });
    if (!existing.points.length) {
      throw new NotFoundException('Article vectors not found');
    }

    await client.delete(collectionName, {
      filter: {
        must: [
          {
            key: 'articleId',
            match: {
              value: articleId,
            },
          },
        ],
      },
      wait: true,
    });
  }

  private buildSearchFilter(dto: RagSearchRequestDto) {
    const must: any[] = [];

    if (dto.articleStatus) {
      must.push({
        key: 'status',
        match: {
          value: dto.articleStatus,
        },
      });
    }
    if (dto.categoryId) {
      must.push({
        key: 'categoryId',
        match: {
          value: dto.categoryId,
        },
      });
    }
    if (dto.tags?.length) {
      must.push(
        ...dto.tags.map((tag) => ({
          key: 'tags',
          match: {
            value: tag,
          },
        })),
      );
    }

    return must.length ? { must } : undefined;
  }

  async search(dto: RagSearchRequestDto) {
    const client = this.qdrantService.getClient();
    const collectionName = this.qdrantService.getCollectionName();
    const embedding = await this.geminiService.generateEmbeddings(dto.query);

    const searchResult = await client.search(collectionName, {
      vector: embedding,
      limit: dto.limit ?? 5,
      filter: this.buildSearchFilter(dto),
    });

    return {
      results: searchResult.map((point) => ({
        articleId: point.payload?.articleId,
        articleTitle: point.payload?.articleTitle,
        chunk: point.payload?.chunk,
        similarity: point.score,
      })),
    };
  }

  private async retrieveRelevantChunks(query: string, limit = 5) {
    const client = this.qdrantService.getClient();
    const collectionName = this.qdrantService.getCollectionName();
    const embedding = await this.geminiService.generateEmbeddings(query);

    return client.search(collectionName, {
      vector: embedding,
      limit,
    });
  }

  async chat(dto: RagChatRequestDto) {
    const conversationId = dto.conversationId ?? crypto.randomUUID();
    const history = this.getConversationHistory(conversationId);
    const formattedHistory = this.formatConversationHistory(history);

    const retrievedChunks = await this.retrieveRelevantChunks(dto.question, 5);
    if (!retrievedChunks.length) {
      return {
        answer: 'No relevant information found.',
        sources: [],
        conversationId: dto.conversationId ?? crypto.randomUUID(),
      };
    }

    const context = retrievedChunks
      .map((chunk) => chunk.payload?.chunk)
      .join('\n\n');

    const prompt = buildRagChatPrompt(dto.question, context, formattedHistory);
    const answer = await this.geminiService.generateContext(prompt);
    this.saveConversationMessage(conversationId, {
      role: 'user',
      content: dto.question,
    });
    this.saveConversationMessage(conversationId, {
      role: 'assistant',
      content: answer,
    });

    return {
      answer,
      sources: retrievedChunks.map((chunk) => ({
        articleId: chunk.payload?.articleId,
        articleTitle: chunk.payload?.articleTitle,
        relevantChunk: chunk.payload?.chunk,
      })),

      conversationId: dto.conversationId ?? crypto.randomUUID(),
    };
  }

  private getConversationHistory(
    conversationId: string,
  ): ConversationMessage[] {
    return this.conversations.get(conversationId) ?? [];
  }

  private saveConversationMessage(
    conversationId: string,
    message: ConversationMessage,
  ) {
    const history = this.getConversationHistory(conversationId);
    history.push(message);
    const trimmedHistory = history.slice(-this.maxConversationMessages);
    this.conversations.set(conversationId, trimmedHistory);
  }

  private formatConversationHistory(history: ConversationMessage[]): string {
    return history
      .map((message) => `${message.role}: ${message.content}`)
      .join('\n');
  }


}
