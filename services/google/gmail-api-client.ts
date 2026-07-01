import { googleConfig } from '@/config/google'
import type {
  GmailHistoryResponse,
  GmailMessage,
  GmailProfile,
  GmailThread,
  GmailThreadsListResponse,
} from '@/types/google'

// ─── Retry / backoff ─────────────────────────────────────────────────────────

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1_000

// Retryable status codes: 429 (rate limit) and 5xx (transient server errors).
function isRetryable(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600)
}

async function gmailFetch<T>(
  path: string,
  accessToken: string,
  attempt = 0
): Promise<T> {
  const res = await fetch(`${googleConfig.gmailApiBase}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (res.status === 401) throw new Error('GMAIL_UNAUTHORIZED')

  if (isRetryable(res.status) && attempt < MAX_RETRIES) {
    // Exponential backoff with ±25% jitter
    const delay = BASE_DELAY_MS * Math.pow(2, attempt) * (0.75 + Math.random() * 0.5)
    await new Promise((r) => setTimeout(r, delay))
    return gmailFetch<T>(path, accessToken, attempt + 1)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gmail API error (${res.status}): ${text}`)
  }

  return res.json() as Promise<T>
}

// ─── Gmail API client ─────────────────────────────────────────────────────────

export function createGmailApiClient() {
  return {
    async getProfile(accessToken: string): Promise<GmailProfile> {
      return gmailFetch<GmailProfile>('/users/me/profile', accessToken)
    },

    async listThreads(
      accessToken: string,
      options: {
        q?: string
        labelIds?: string[]
        pageToken?: string
        maxResults?: number
      } = {}
    ): Promise<GmailThreadsListResponse> {
      const params = new URLSearchParams()
      if (options.q) params.set('q', options.q)
      if (options.pageToken) params.set('pageToken', options.pageToken)
      params.set(
        'maxResults',
        String(options.maxResults ?? googleConfig.gmailMaxThreadsPerPage)
      )
      if (options.labelIds) {
        for (const label of options.labelIds) {
          params.append('labelIds', label)
        }
      }
      return gmailFetch<GmailThreadsListResponse>(
        `/users/me/threads?${params}`,
        accessToken
      )
    },

    // Paginates through all pages and returns the full list of thread IDs.
    // Used for initial sync only — delta sync uses listHistory instead.
    async listAllThreadIds(
      accessToken: string,
      options: { q?: string; labelIds?: string[] } = {}
    ): Promise<string[]> {
      const ids: string[] = []
      let pageToken: string | undefined

      do {
        const page = await this.listThreads(accessToken, { ...options, pageToken })
        for (const t of page.threads ?? []) {
          ids.push(t.id)
        }
        pageToken = page.nextPageToken
      } while (pageToken)

      return ids
    },

    async getThread(
      accessToken: string,
      threadId: string,
      format: 'full' | 'metadata' | 'minimal' = 'metadata'
    ): Promise<GmailThread> {
      const params = new URLSearchParams({ format })
      return gmailFetch<GmailThread>(
        `/users/me/threads/${encodeURIComponent(threadId)}?${params}`,
        accessToken
      )
    },

    async getMessage(
      accessToken: string,
      messageId: string,
      format: 'full' | 'metadata' | 'minimal' = 'metadata'
    ): Promise<GmailMessage> {
      const params = new URLSearchParams({ format })
      return gmailFetch<GmailMessage>(
        `/users/me/messages/${encodeURIComponent(messageId)}?${params}`,
        accessToken
      )
    },

    async listHistory(
      accessToken: string,
      startHistoryId: string,
      options: {
        pageToken?: string
        maxResults?: number
        historyTypes?: Array<'messageAdded' | 'messageDeleted' | 'labelAdded' | 'labelRemoved'>
      } = {}
    ): Promise<GmailHistoryResponse> {
      const params = new URLSearchParams({ startHistoryId })
      if (options.pageToken) params.set('pageToken', options.pageToken)
      params.set('maxResults', String(options.maxResults ?? 500))
      if (options.historyTypes) {
        for (const t of options.historyTypes) {
          params.append('historyTypes', t)
        }
      }
      return gmailFetch<GmailHistoryResponse>(
        `/users/me/history?${params}`,
        accessToken
      )
    },
  }
}

export type GmailApiClient = ReturnType<typeof createGmailApiClient>
