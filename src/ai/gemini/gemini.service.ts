import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeminiService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.baseUrl = this.configService.get<string>('GEMINI_API_BASE_URL');
    this.model = this.configService.get<string>('GEMINI_MODEL');
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delayMs = 500,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const status = error.response?.status;
      const isRetryable =
        error.code === 'ECONNABORTED' || // timeout
        !status || // network
        status === 429 ||
        status >= 500;

      if (!isRetryable || retries === 0) {
        throw error;
      }

      await new Promise((res) => setTimeout(res, delayMs));

      return this.withRetry(fn, retries - 1, delayMs * 2);
    }
  }

  async generateContext(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    try {
      return this.withRetry(async () => {
        const response = await firstValueFrom(
          this.httpService.post(
            url,
            {
              contents: {
                parts: [{ text: prompt }],
              },
            },
            { timeout: 5000 },
          ),
        );
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new HttpException(
            'Invalid response from AI',
            HttpStatus.BAD_GATEWAY,
          );
        }
        return text;
      });
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new HttpException(
          'AI service timeout',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const status = error.response?.status;
      if (status === 401 || status === 403) {
        throw new HttpException(
          'AI authentificate failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      if (status === 429) {
        throw new HttpException(
          'AI rate limit exceeded',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        'AI service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
