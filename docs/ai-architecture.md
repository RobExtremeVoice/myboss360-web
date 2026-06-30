# Executive AI Architecture

## Overview

MyBoss360 Executive AI is not a chatbot wrapper around an LLM.

It is a **structured intelligence layer** where:
- Business context is the permanent asset
- LLMs are interchangeable processing units
- Every response is grounded in live operational data

The user does not talk directly to a model. The user talks to **MyBoss360 Executive AI**, which loads context, builds prompts, routes tool calls, manages conversations, and then optionally delegates to a chosen LLM provider.

---

## Layer Architecture

```
User → /dashboard/ai-assistant
          ↓
    AIAssistantLayout (client)
          ↓
    POST /api/ai/messages
          ↓
    AIService.sendMessage()
          ├── loadExecutiveContext()          ← ContextLoader
          │       ↓
          │   IntelligenceService             ← Sprint 16
          │       ↓
          │   IntelligenceContext (typed)
          │
          ├── ConversationManager            ← Stores messages, manages history
          │
          ├── buildSystemPrompt()            ← PromptBuilder
          │       ↓
          │   Structured system prompt with business context embedded
          │
          ├── buildToolSchemas()             ← PromptBuilder
          │       ↓
          │   JSON Schema tool definitions (OpenAI function-calling format)
          │
          └── ProviderRegistry.getDefaultProvider()
                  ↓
              MockProvider (Sprint 17A) / OpenAI / Anthropic / Gemini / Ollama
                  ↓
              GenerateResponse (content, tokensUsed, finishReason)
                  ↓
              ConversationManager.addAssistantMessage()
```

---

## Components

### ContextLoader (`services/ai/context-loader.ts`)

Loads `IntelligenceContext` via the Intelligence Service (Sprint 16). The AI never queries CRM or task tables directly — all data comes through this single entrypoint.

This ensures:
- Consistent data view across all AI interactions
- One place to add caching, rate limiting, or access control
- Context can be serialized into prompts or passed structurally to providers

### PromptBuilder (`services/ai/prompt-builder.ts`)

Converts `IntelligenceContext` into a structured system prompt. Sections:
- System instructions
- User identity + workspace
- Executive metrics (pipeline value, overdue tasks, at-risk deals)
- Top risks + opportunities
- Active recommendations
- Strategic memory excerpts
- Today's calendar
- Overdue high-priority tasks
- Available tool schemas
- Closing instructions

The prompt is designed to be sent verbatim to any OpenAI-compatible API. No model-specific logic in the builder.

### ProviderRegistry (`services/ai/provider-registry.ts`)

A module-level Map of registered `AIProvider` implementations. Providers are registered on first import of `ai-service.ts`. All providers implement the same `AIProvider` interface:

```typescript
interface AIProvider {
  id: string
  name: string
  modelId: string
  capabilities: AICapability[]
  maxContextTokens: number
  supportsStreaming: boolean
  status: AIProviderStatus
  generate(request: GenerateRequest): Promise<GenerateResponse>
  stream(request: GenerateRequest): AsyncIterable<StreamChunk>
}
```

### MockProvider (`services/ai/providers/mock-provider.ts`)

The only active provider in Sprint 17A. Generates deterministic, data-aware responses by:
1. Inspecting the last user message content (keyword matching)
2. Reading the `context?: IntelligenceContext` passed in `GenerateRequest`
3. Formatting a response using real business data (pipeline value, overdue tasks, risks, etc.)

No external API calls. No randomness. Fully reproducible.

Keyword branches: briefing/today/focus → daily briefing · pipeline/deal → deal summary · task/overdue → task summary · calendar/meeting → agenda · risk/warn → top risks · opportunity/grow → opportunities · default → generic executive response.

### ConversationManager (`services/ai/conversation-manager.ts`)

Manages conversation and message lifecycle:
- `createConversation()` — inserts into `ai_conversations`
- `addUserMessage()` / `addAssistantMessage()` — inserts into `ai_messages`
- `getRecentHistory()` — fetches last N messages for multi-turn context window
- `updateTitle()` — auto-titled from first user message
- `archiveConversation()` — soft-deletes
- `touchUpdatedAt()` — bumps `updated_at` after each assistant reply so the sidebar shows correct recency

### ToolRouter (`services/ai/tool-router.ts`)

Registry of tool handlers callable by LLMs. Tool names match the `buildToolSchemas()` definitions so they can be wired directly to OpenAI function calling.

| Tool | Status | Implementation |
|---|---|---|
| `getExecutiveContext` | Active | Returns executive metrics summary |
| `listDeals` | Active | Queries `deals` table with optional stage filter |
| `listTasks` | Active | Queries `tasks` table with status/priority filters |
| `summarizePipeline` | Active | Aggregates deal value by stage |
| `createRecommendationFeedback` | Active | Calls LearningService |
| `createTask` | Not implemented | Returns placeholder message |
| `updateDealStage` | Not implemented | Returns placeholder message |
| `createFollowUp` | Not implemented | Returns placeholder message |
| `listCompanies` | Not implemented | Returns placeholder message |

Write tools are deferred to Sprint 17B to ensure proper validation and audit trails before execution.

### AIService (`services/ai/ai-service.ts`)

Top-level orchestrator called from API routes. `sendMessage()` flow:
1. Create conversation if no `conversationId` provided
2. Store user message
3. Load executive context + user profile in parallel
4. Fetch recent message history for multi-turn context
5. Build system prompt
6. Get default provider
7. Call `provider.generate()`
8. Store assistant message + touch conversation `updated_at`
9. Auto-title new conversation from first user message
10. Return `{ conversationId, userMessage, assistantMessage, isNewConversation }`

### StreamingUtils (`services/ai/streaming.ts`)

Utilities for streaming responses:
- `collectStream()` — accumulates full text from `AsyncIterable<StreamChunk>` for non-streaming routes
- `toReadableStream()` — proxy for streaming API routes (Sprint 17B)
- `encodeSSE()` — encodes a chunk as `data: {...}\n\n` for Server-Sent Events

---

## Data Layer

### Database tables

| Table | Purpose |
|---|---|
| `ai_conversations` | Conversation metadata (workspace, user, title, model, org) |
| `ai_messages` | Messages (role: user/assistant/system, content, tokens_used) |

### Schema note

`ai_conversations` has `organization_id` added in migration `20260630000002_ai_infrastructure.sql`. This enables org-level multi-workspace isolation consistent with the rest of the platform.

### ConversationRepository / MessageRepository

Typed wrappers over Supabase. Enforce soft-delete (conversations), ordering (messages by `created_at`), and per-user scoping.

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/ai/conversations` | GET | List user's conversations for workspace |
| `/api/ai/conversations` | POST | Create a new conversation |
| `/api/ai/conversations/[id]` | GET | Get conversation with messages |
| `/api/ai/conversations/[id]` | PATCH | Update title or archive |
| `/api/ai/messages` | POST | Send message + receive assistant response |

All routes require an authenticated session cookie. Ownership checks on `[id]` routes prevent cross-user access.

---

## UI Components

| Component | Purpose |
|---|---|
| `AIChatWindow` | Main interactive chat container; manages message list, loading, API calls |
| `AIMessage` | Renders a single message bubble (user/assistant styles) |
| `AIComposer` | Auto-growing textarea + send button; Enter to send, Shift+Enter for newline |
| `AIConversationSidebar` | Lists past conversations with recency timestamps; new conversation button |
| `AIPromptSuggestions` | Quick-prompt chips shown in empty chat state |
| `ExecutiveContextPanel` | Shows live executive metrics (pipeline, risks, overdue, closed won) |
| `AIStatusBadge` | Provider name + status pill shown in chat header |

---

## How OpenAI/Anthropic integration will work

1. Install the provider SDK (`openai` / `@anthropic-ai/sdk`)
2. Create a concrete class extending `AIProvider` in `services/ai/providers/`
3. Implement `generate()` and `stream()` using the SDK
4. Set the `status` to `'active'` when the API key env var is present
5. Register the provider in `ai-service.ts` alongside MockProvider
6. Set `aiConfig.defaultProviderId` to the new provider id, or allow per-conversation selection

The system prompt, tool schemas, and ConversationManager are provider-agnostic. No other code changes are needed.

For **streaming responses** (Sprint 17B):
- The `/api/ai/messages` route uses `collectStream()` today (full response)
- Switch to a `ReadableStream` response using `encodeSSE()` and `toReadableStream()`
- The `AIChatWindow` switches from `fetch + json` to `EventSource` or `fetch + ReadableStream`

---

## How MCP tools may fit

The `ToolRouter` registers handlers that match the `AITool` JSON schema format. MCP tools can be surfaced to an LLM the same way — each MCP tool becomes an entry in `buildToolSchemas()` and a handler in `tool-router.ts`. The `routeToolCall()` function dispatches to the right handler regardless of where the tool came from.

---

## Why LLMs are replaceable

The provider interface isolates all model-specific logic:
- Token counting → provider-specific
- Prompt format → built by PromptBuilder (provider-agnostic)
- Tool call format → JSON Schema (compatible with OpenAI, Anthropic, Gemini)
- Response parsing → provider-specific

Business context, conversation history, tool schemas, and memory storage are all independent of which model processes them. Switching from GPT-4o to Claude or Gemini requires only swapping the provider implementation — no changes to context loading, prompt building, conversation management, or UI.

---

## Sprint 17B — Remaining work

- Wire real OpenAI or Anthropic provider (add API key env var + SDK)
- Implement write tools: `createTask`, `updateDealStage`, `createFollowUp`
- Add tool-call loop: if response includes `toolCalls`, execute via ToolRouter and re-submit results
- Implement streaming endpoint + SSE-based AIChatWindow
- Add per-conversation provider selection (model picker UI)
- Write AI-generated memories back to MemoryEngine after each conversation
- Add lightweight test suite (vitest — not in package.json yet)
