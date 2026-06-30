import type { AIProvider, GenerateRequest, StreamChunk } from '@/types/ai'

// Collects a full response from an AsyncIterable stream.
// Used when the API route needs to return a complete response (non-streaming mode).
export async function collectStream(
  provider: AIProvider,
  request: GenerateRequest
): Promise<string> {
  let content = ''
  for await (const chunk of provider.stream(request)) {
    content += chunk.delta
    if (chunk.isDone) break
  }
  return content
}

// Converts a stream to a ReadableStream for HTTP streaming responses.
// Used in streaming API routes (Sprint 17B+).
export async function* toReadableStream(
  provider: AIProvider,
  request: GenerateRequest
): AsyncIterable<StreamChunk> {
  yield* provider.stream(request)
}

// Encodes a stream chunk as a Server-Sent Event (SSE) data line.
export function encodeSSE(chunk: StreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`
}
