import type { ChunkInput, ChunkOutput, ChunkStrategy, ParseResult } from '@/types/knowledge'
import { knowledgeConfig } from '@/config/knowledge'

// ─── Parser ──────────────────────────────────────────────────────────────────
// Normalizes raw input into clean content + metadata.
// Designed to be extended with binary parsers (PDF, DOCX) in future sprints.

export function parseDocument(rawContent: string, mimeType = 'text/plain'): ParseResult {
  const content = rawContent.trim()
  const words = content.split(/\s+/).filter(Boolean)

  return {
    content,
    wordCount: words.length,
    characterCount: content.length,
    metadata: {
      mimeType,
      parsedAt: new Date().toISOString(),
    },
  }
}

// ─── Chunker ─────────────────────────────────────────────────────────────────
// Splits document content into retrievable fragments.
// No embeddings yet — chunks are stored with token_count estimated from char count.

function estimateTokenCount(text: string): number {
  // Approximate: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4)
}

function chunkByParagraph(content: string, maxSize: number): string[] {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const chunks: string[] = []
  let current = ''

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph
    if (estimateTokenCount(candidate) > maxSize && current) {
      chunks.push(current)
      current = paragraph
    } else {
      current = candidate
    }
  }

  if (current) chunks.push(current)
  return chunks
}

function chunkBySentence(content: string, maxSize: number): string[] {
  // Split on sentence boundaries: ., ?, ! followed by space or newline
  const sentences = content.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [content]
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence.trim()}` : sentence.trim()
    if (estimateTokenCount(candidate) > maxSize && current) {
      chunks.push(current)
      current = sentence.trim()
    } else {
      current = candidate
    }
  }

  if (current) chunks.push(current)
  return chunks
}

function chunkByFixedSize(content: string, maxSize: number, overlap: number): string[] {
  const words = content.split(/\s+/)
  const wordsPerChunk = Math.max(1, maxSize * 3)  // ~3 words per token heuristic
  const overlapWords = Math.max(0, overlap * 3)
  const chunks: string[] = []
  let i = 0

  while (i < words.length) {
    const end = Math.min(i + wordsPerChunk, words.length)
    chunks.push(words.slice(i, end).join(' '))
    i += wordsPerChunk - overlapWords
    if (i <= 0) break  // safety guard
  }

  return chunks
}

export function chunkDocument(input: ChunkInput): ChunkOutput {
  const {
    content,
    strategy,
    maxChunkSize = knowledgeConfig.defaultMaxChunkSize,
    overlapSize = knowledgeConfig.defaultChunkOverlap,
  } = input

  let rawChunks: string[]

  switch (strategy) {
    case 'paragraph':
      rawChunks = chunkByParagraph(content, maxChunkSize)
      break
    case 'sentence':
      rawChunks = chunkBySentence(content, maxChunkSize)
      break
    case 'fixed_size':
      rawChunks = chunkByFixedSize(content, maxChunkSize, overlapSize)
      break
    case 'semantic':
      // Future: NLP-based semantic segmentation.
      // Falls back to paragraph for now.
      rawChunks = chunkByParagraph(content, maxChunkSize)
      break
    default:
      rawChunks = chunkByParagraph(content, maxChunkSize)
  }

  // Enforce per-document chunk cap
  const capped = rawChunks.slice(0, knowledgeConfig.maxChunksPerDocument)

  const chunks = capped.map((c, i) => ({
    content: c,
    chunkIndex: i,
    tokenCount: estimateTokenCount(c),
    metadata: { strategy },
  }))

  return {
    chunks,
    strategy,
    totalChunks: chunks.length,
  }
}

// ─── Pipeline orchestrator ───────────────────────────────────────────────────

export interface PipelineInput {
  rawContent: string
  mimeType?: string
  strategy?: ChunkStrategy
  maxChunkSize?: number
}

export interface PipelineOutput {
  parsed: ParseResult
  chunked: ChunkOutput
}

export function runDocumentPipeline(input: PipelineInput): PipelineOutput {
  const parsed = parseDocument(input.rawContent, input.mimeType)

  const chunked = chunkDocument({
    content: parsed.content,
    strategy: input.strategy ?? knowledgeConfig.defaultChunkStrategy,
    maxChunkSize: input.maxChunkSize ?? knowledgeConfig.defaultMaxChunkSize,
    overlapSize: knowledgeConfig.defaultChunkOverlap,
  })

  return { parsed, chunked }
}
