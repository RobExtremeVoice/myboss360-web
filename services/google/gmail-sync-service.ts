import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { GmailSyncResult } from '@/types/google'
import { googleConfig, connectionHasGmailScope } from '@/config/google'
import { createGmailApiClient } from './gmail-api-client'
import { createGoogleOAuthService } from './google-oauth-service'
import { createGoogleConnectionsRepository } from '@/repositories/google/connections'
import { createGmailSyncRepository } from '@/repositories/google/gmail-sync'

// ─── Service factory ──────────────────────────────────────────────────────────

export function createGmailSyncService(db: SupabaseClient<Database>) {
  const oauthService = createGoogleOAuthService(db)
  const connectionsRepo = createGoogleConnectionsRepository(db)
  const syncRepo = createGmailSyncRepository(db)
  const apiClient = createGmailApiClient()

  async function getAccessToken(connectionId: string): Promise<string> {
    const tokens = await oauthService.getActiveTokens(connectionId)
    return tokens.accessToken
  }

  return {
    // Decide initial vs delta and run the appropriate sync.
    // Returns the list of affected thread IDs so downstream parts (3–13) can
    // process them once those parts are implemented.
    async runSync(connectionId: string): Promise<GmailSyncResult> {
      const connection = await connectionsRepo.findById(connectionId)
      if (!connection) throw new Error(`Google connection ${connectionId} not found`)
      if (connection.status !== 'active') {
        throw new Error(`Google connection ${connectionId} is not active (status: ${connection.status})`)
      }
      if (!connectionHasGmailScope(connection.scopes)) {
        throw new Error(
          'This Google connection does not have Gmail read access. ' +
          'The user must re-authorize to grant the gmail.readonly scope.'
        )
      }

      const accessToken = await getAccessToken(connectionId)
      const syncState = await syncRepo.findByConnectionId(connectionId)

      if (!syncState?.history_id) {
        return this.initialSync(connectionId, accessToken)
      }
      return this.deltaSync(connectionId, syncState.history_id, accessToken)
    },

    // Full sync: fetch all thread IDs from the last N days.
    // Snapshots the current historyId BEFORE fetching so any new messages that
    // arrive during the sync are caught on the next delta run.
    async initialSync(connectionId: string, accessToken: string): Promise<GmailSyncResult> {
      // Snapshot historyId first so we don't miss messages arriving during the fetch
      const profile = await apiClient.getProfile(accessToken)
      const snapshotHistoryId = profile.historyId

      const cutoffSec = Math.floor(
        (Date.now() - googleConfig.gmailSyncLookBackDays * 86_400_000) / 1000
      )
      const threadIds = await apiClient.listAllThreadIds(accessToken, {
        q: `after:${cutoffSec}`,
        labelIds: ['INBOX'],
      })

      await syncRepo.upsert({
        connection_id: connectionId,
        history_id: snapshotHistoryId,
        last_sync_at: new Date().toISOString(),
        total_threads_synced: threadIds.length,
      })

      return {
        threadIds,
        historyId: snapshotHistoryId,
        synced: threadIds.length,
        isInitial: true,
      }
    },

    // Delta sync: use history.list to get only thread IDs that changed since
    // the last recorded historyId. Falls back to full initial sync when Google
    // reports the historyId has expired (HTTP 404 historyNotFound).
    async deltaSync(
      connectionId: string,
      startHistoryId: string,
      accessToken: string
    ): Promise<GmailSyncResult> {
      const threadIdSet = new Set<string>()
      let nextPageToken: string | undefined
      let latestHistoryId = startHistoryId

      try {
        do {
          const page = await apiClient.listHistory(accessToken, startHistoryId, {
            pageToken: nextPageToken,
            historyTypes: ['messageAdded', 'messageDeleted', 'labelAdded', 'labelRemoved'],
          })

          // history.list always returns the current historyId, even when history is empty
          latestHistoryId = page.historyId

          for (const item of page.history ?? []) {
            // Collect from messagesAdded (most common) and fallback messages array
            for (const entry of item.messagesAdded ?? []) {
              threadIdSet.add(entry.message.threadId)
            }
            for (const entry of item.messagesDeleted ?? []) {
              threadIdSet.add(entry.message.threadId)
            }
            for (const entry of item.labelsAdded ?? []) {
              threadIdSet.add(entry.message.threadId)
            }
            for (const entry of item.labelsRemoved ?? []) {
              threadIdSet.add(entry.message.threadId)
            }
            // Fallback: plain messages array present in some history types
            for (const msg of item.messages ?? []) {
              threadIdSet.add(msg.threadId)
            }
          }

          nextPageToken = page.nextPageToken
        } while (nextPageToken)
      } catch (err) {
        // Google returns 404 when the historyId has expired (typically > 7 days old).
        // Reset by running a full initial sync.
        if (err instanceof Error && err.message.includes('404')) {
          console.warn('[gmail-sync] historyId expired — falling back to initial sync')
          return this.initialSync(connectionId, accessToken)
        }
        throw err
      }

      const threadIds = [...threadIdSet]

      await syncRepo.recordSync(connectionId, threadIds.length, latestHistoryId)

      return {
        threadIds,
        historyId: latestHistoryId,
        synced: threadIds.length,
        isInitial: false,
      }
    },

    // Return the current sync state for a connection without triggering a sync.
    async getSyncState(connectionId: string) {
      return syncRepo.findByConnectionId(connectionId)
    },
  }
}

export type GmailSyncService = ReturnType<typeof createGmailSyncService>
