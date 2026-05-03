# Knowledge Hub

## Prerequisites

- Git - [Download & Install Git](https://git-scm.com/downloads).
- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.

## Downloading

```
git clone {repository URL}
```

## Installing NPM modules

```
npm install
```

## Running application

```
npm start
```

After starting the app on port (4000 as default) you can open
in your browser OpenAPI documentation by typing http://localhost:4000/doc/.
For more information about OpenAPI/Swagger please visit https://swagger.io/.

## Testing

After application running open new terminal and enter:

To run all tests without authorization

```
npm run test
```

To run only one of all test suites

```
npm run test -- <path to suite>
```

### Auto-fix and format

```
npm run lint
```

```
npm run format
```

### Debugging in VSCode

Press <kbd>F5</kbd> to debug.

For more information, visit: https://code.visualstudio.com/docs/editor/debugging

## Docker Image

The application image is available on Docker Hub:

https://hub.docker.com/r/aliakseivarabyou/knowledge-hub

You can pull and run it using:

docker pull aliakseivarabyou/knowledge-hub:latest

## AI Integration (Gemini)

This project includes AI-powered features built on top of Google Gemini API.

All AI functionality is implemented in a dedicated `AiModule` with isolated service architecture.

---

### AI Model

- Provider: Google Generative Language API
- Model: `gemini-2.0-flash`
- Integration: HTTP (NestJS HttpService)

---

### How to get Gemini API key

- Go to: https://aistudio.google.com/app/apikey
- Sign in with your Google account
- Click Create API key
- Select or create a Google Cloud project
- Copy the generated API key

Make sure the Generative Language API is enabled in your Google Cloud project:
https://console.cloud.google.com/

---

### Environment Setup

Add the following variables to your `.env` file:

GEMINI_API_KEY=your_api_key_here  
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com  
GEMINI_MODEL=gemini-2.0-flash

AI_RATE_LIMIT_RPM=20  
AI_CACHE_TTL_SEC=300

---

### AI Endpoints

#### Summarize Article

POST /ai/articles/:articleId/summarize

Request:
{
"maxLength": "short" | "medium" | "detailed"
}

Response:
{
"articleId": "string",
"summary": "string",
"originalLength": number,
"summaryLength": number
}

---

#### Translate Article

POST /ai/articles/:articleId/translate

Request:
{
"targetLanguage": "string",
"sourceLanguage": "string (optional)"
}

Response:
{
"articleId": "string",
"translatedText": "string",
"detectedLanguage": "string"
}

---

#### Analyze Article

POST /ai/articles/:articleId/analyze

Request:
{
"task": "review" | "bugs" | "optimize" | "explain"
}

Response:
{
"articleId": "string",
"analysis": "string",
"suggestions": ["string"],
"severity": "info" | "warning" | "error"
}

---

#### AI Usage Stats

GET /ai/usage

Response:
{
"totalRequests": number,
"byEndpoint": {
"summarize": number,
"translate": number,
"analyze": number
}
}

---

### Caching

- Applied to summarize and translate endpoints
- In-memory storage
- Cache key includes:
  - articleId
  - updatedAt
  - request parameters
- TTL configurable via AI_CACHE_TTL_SEC

---

### Rate Limiting

- Default: 20 requests per minute
- Configurable via AI_RATE_LIMIT_RPM
- Returns:
  - 429 Too Many Requests
  - Retry-After header

---

### Usage Tracking

Tracks AI usage in memory:

- total requests
- requests per endpoint

Note: data resets on server restart

---

### Security

- API keys stored in environment variables
- No sensitive data is logged
- Input validation via DTO + ValidationPipe

---

### Limitations

- Uses in-memory cache (not persistent)
- Free-tier Gemini API has quotas and rate limits
- Large articles may be truncated by model
- Usage tracking resets on restart
