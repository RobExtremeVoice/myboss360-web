import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { GoogleConnection, GoogleOAuthTokenResponse, GoogleTokens, GoogleUserInfo } from '@/types/google'
import { googleConfig } from '@/config/google'
import { createGoogleConnectionsRepository } from '@/repositories/google/connections'
import { createGoogleTokensRepository } from '@/repositories/google/tokens'

const ALGO = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const hex = googleConfig.tokenEncryptionKey
  if (!hex || hex.length !== 64) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).')
  }
  return Buffer.from(hex, 'hex')
}

function encryptToken(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

function decryptToken(ciphertext: string): string {
  const key = getEncryptionKey()
  const parts = ciphertext.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted token format.')
  const [ivHex, tagHex, dataHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

// ─── OAuth URL builder ────────────────────────────────────────────────────────

export function buildAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.redirectUri,
    response_type: 'code',
    scope: googleConfig.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `${googleConfig.authorizationUrl}?${params.toString()}`
}

// ─── State helpers ────────────────────────────────────────────────────────────

export function encodeOAuthState(workspaceId: string, userId: string): string {
  return Buffer.from(JSON.stringify({ workspaceId, userId })).toString('base64url')
}

export function decodeOAuthState(state: string): { workspaceId: string; userId: string } | null {
  try {
    const obj = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'))
    if (typeof obj.workspaceId !== 'string' || typeof obj.userId !== 'string') return null
    return obj as { workspaceId: string; userId: string }
  } catch {
    return null
  }
}

// ─── Token exchange and refresh ───────────────────────────────────────────────

async function exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokenResponse> {
  const res = await fetch(googleConfig.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      redirect_uri: googleConfig.redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google token exchange failed (${res.status}): ${text}`)
  }
  return res.json() as Promise<GoogleOAuthTokenResponse>
}

async function refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokenResponse> {
  const res = await fetch(googleConfig.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google token refresh failed (${res.status}): ${text}`)
  }
  return res.json() as Promise<GoogleOAuthTokenResponse>
}

async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(googleConfig.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch Google user info (${res.status})`)
  }
  return res.json() as Promise<GoogleUserInfo>
}

// ─── Service factory ──────────────────────────────────────────────────────────

export function createGoogleOAuthService(db: SupabaseClient<Database>) {
  const connectionsRepo = createGoogleConnectionsRepository(db)
  const tokensRepo = createGoogleTokensRepository(db)

  return {
    buildAuthorizationUrl,
    encodeOAuthState,
    decodeOAuthState,

    async handleCallback(
      code: string,
      workspaceId: string,
      organizationId: string,
      userId: string
    ): Promise<GoogleConnection> {
      const tokenResponse = await exchangeCodeForTokens(code)
      const userInfo = await fetchUserInfo(tokenResponse.access_token)

      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()

      const connectionRow = await connectionsRepo.upsert({
        workspace_id: workspaceId,
        organization_id: organizationId,
        user_id: userId,
        google_account_email: userInfo.email,
        scopes: tokenResponse.scope.split(' '),
        status: 'active',
        error_message: null,
      })

      await tokensRepo.upsert({
        connection_id: connectionRow.id,
        access_token_enc: encryptToken(tokenResponse.access_token),
        refresh_token_enc: encryptToken(tokenResponse.refresh_token ?? ''),
        token_type: tokenResponse.token_type,
        expires_at: expiresAt,
      })

      return toGoogleConnection(connectionRow)
    },

    async getConnection(workspaceId: string, userId: string): Promise<GoogleConnection | null> {
      const row = await connectionsRepo.findByWorkspaceAndUser(workspaceId, userId)
      return row ? toGoogleConnection(row) : null
    },

    async getActiveTokens(connectionId: string): Promise<GoogleTokens> {
      const tokenRow = await tokensRepo.findByConnectionId(connectionId)
      if (!tokenRow) throw new Error(`No tokens found for connection ${connectionId}`)

      const expiresAt = new Date(tokenRow.expires_at).getTime()
      const needsRefresh = Date.now() >= expiresAt - googleConfig.tokenRefreshBufferMs

      if (needsRefresh) {
        const refreshToken = decryptToken(tokenRow.refresh_token_enc)
        const refreshed = await refreshAccessToken(refreshToken)
        const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

        const updated = await tokensRepo.update(connectionId, {
          access_token_enc: encryptToken(refreshed.access_token),
          expires_at: newExpiresAt,
        })
        return toGoogleTokens(updated, refreshed.access_token, refreshToken)
      }

      const accessToken = decryptToken(tokenRow.access_token_enc)
      const refreshToken = decryptToken(tokenRow.refresh_token_enc)
      return toGoogleTokens(tokenRow, accessToken, refreshToken)
    },

    async revokeConnection(connectionId: string): Promise<void> {
      const tokenRow = await tokensRepo.findByConnectionId(connectionId)
      if (tokenRow) {
        try {
          const accessToken = decryptToken(tokenRow.access_token_enc)
          await fetch(`${googleConfig.revokeUrl}?token=${accessToken}`, { method: 'POST' })
        } catch {
          // Revocation errors are non-fatal — mark as revoked in DB either way
        }
        await tokensRepo.deleteByConnectionId(connectionId)
      }
      await connectionsRepo.setStatus(connectionId, 'revoked')
    },

    async saveConnection(
      workspaceId: string,
      organizationId: string,
      userId: string,
      googleAccountEmail: string,
      scopes: string[]
    ): Promise<GoogleConnection> {
      const row = await connectionsRepo.upsert({
        workspace_id: workspaceId,
        organization_id: organizationId,
        user_id: userId,
        google_account_email: googleAccountEmail,
        scopes,
        status: 'active',
        error_message: null,
      })
      return toGoogleConnection(row)
    },
  }
}

export type GoogleOAuthService = ReturnType<typeof createGoogleOAuthService>

// ─── Row mappers ──────────────────────────────────────────────────────────────

function toGoogleConnection(
  row: Database['public']['Tables']['google_connections']['Row']
): GoogleConnection {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    googleAccountEmail: row.google_account_email,
    scopes: row.scopes,
    status: row.status as GoogleConnection['status'],
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toGoogleTokens(
  row: Database['public']['Tables']['google_tokens']['Row'],
  accessToken: string,
  refreshToken: string
): GoogleTokens {
  return {
    id: row.id,
    connectionId: row.connection_id,
    accessToken,
    refreshToken,
    tokenType: row.token_type,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
