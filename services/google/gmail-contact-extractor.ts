// Pure deterministic parsing functions for Gmail contact extraction.
// No DB access, no AI — all logic is regex / string manipulation.
import type { ExtractedParticipant, NormalizedMessage } from '@/types/google'

// ─── Personal email domains — no org can be inferred from these ──────────────
const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.com.br',
  'hotmail.com', 'hotmail.co.uk',
  'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'protonmail.com', 'proton.me',
  'hey.com', 'fastmail.com', 'zoho.com',
  'yandex.com', 'yandex.ru',
])

const MULTIPART_TLDS = new Set([
  'co.uk',
  'com.au',
  'com.br',
  'com.mx',
  'co.jp',
  'co.in',
  'co.nz',
  'com.sg',
])

// ─── Signature detection patterns ────────────────────────────────────────────
const SIGNATURE_DELIMITERS = [
  /^-- ?$/m,
  /^-{3,}$/m,
  /^_{3,}$/m,
  /^Best regards?,?$/im,
  /^Kind regards?,?$/im,
  /^Warm regards?,?$/im,
  /^With regards?,?$/im,
  /^Regards?,?$/im,
  /^Sincerely,?$/im,
  /^Thank(?:s| you),?$/im,
  /^Cheers?,?$/im,
  /^All the best,?$/im,
  /^Atenciosamente,?$/im,
  /^Att\.?,?$/im,
  /^Abraços?,?$/im,
  /^Sent from my (iPhone|iPad|Android|Galaxy|Samsung|Pixel)/im,
  /^Get Outlook for (iOS|Android)/im,
]

// ─── Email header parsing ─────────────────────────────────────────────────────

/**
 * Parse a single RFC 5322 address like:
 *   "Display Name" <user@example.com>
 *   Display Name <user@example.com>
 *   user@example.com
 */
export function parseEmailAddress(raw: string): { email: string; name: string | null } {
  const trimmed = raw.trim()

  // Angle-bracket form: Name <email>
  const angleMatch = trimmed.match(/^(.*?)\s*<([^>]+)>$/)
  if (angleMatch) {
    const name = angleMatch[1].trim().replace(/^["']|["']$/g, '').trim() || null
    return { email: angleMatch[2].trim().toLowerCase(), name }
  }

  // Plain email
  return { email: trimmed.toLowerCase(), name: null }
}

/**
 * Split a comma-separated address list, respecting quoted names and angle brackets.
 * Handles: "Last, First" <a@b.com>, other@b.com
 */
export function splitAddressList(header: string): string[] {
  const parts: string[] = []
  let depth = 0
  let inQuote = false
  let current = ''

  for (const ch of header) {
    if (ch === '"') {
      inQuote = !inQuote
    } else if (!inQuote && ch === '<') {
      depth++
    } else if (!inQuote && ch === '>') {
      depth--
    } else if (!inQuote && depth === 0 && ch === ',') {
      const trimmed = current.trim()
      if (trimmed) parts.push(trimmed)
      current = ''
      continue
    }
    current += ch
  }

  const trimmed = current.trim()
  if (trimmed) parts.push(trimmed)
  return parts
}

/**
 * Parse a multi-address header value into an array of { email, name }.
 */
export function parseAddressList(header: string): Array<{ email: string; name: string | null }> {
  return splitAddressList(header).map(parseEmailAddress)
}

// ─── Domain / org extraction ──────────────────────────────────────────────────

export function extractDomain(email: string): string {
  const at = email.lastIndexOf('@')
  return at >= 0 ? email.slice(at + 1).toLowerCase() : ''
}

export function isPublicEmailProvider(domain: string): boolean {
  return PERSONAL_DOMAINS.has(domain.toLowerCase())
}

export function normalizeBusinessDomain(domain: string): string {
  const value = domain.trim().toLowerCase()
  if (!value) return ''

  const parts = value.split('.').filter(Boolean)
  if (parts.length <= 2) return value

  const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
  if (MULTIPART_TLDS.has(lastTwo) && parts.length >= 3) {
    return `${parts[parts.length - 3]}.${lastTwo}`
  }

  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
}

/**
 * Derive a human-readable organization name from a domain.
 * Returns null for personal email providers and unrecognizable domains.
 */
export function extractOrganization(domain: string): string | null {
  if (!domain || isPublicEmailProvider(domain)) return null

  // Strip known TLDs and take the second-to-last segment as the org name.
  // e.g. "mail.bigcorp.co.uk" → "bigcorp", "acme.io" → "acme"
  const parts = domain.split('.')
  if (parts.length < 2) return null

  // Remove common TLDs and country codes from the end
  const knownTlds = new Set(['com', 'org', 'net', 'io', 'co', 'ai', 'app', 'dev',
    'uk', 'br', 'de', 'fr', 'jp', 'au', 'ca', 'in', 'mx'])

  let label = parts[0]
  if (parts.length >= 3) {
    // For "mail.company.com" → use "company"; for "company.co.uk" → use "company"
    const candidate = parts[parts.length - 2]
    if (knownTlds.has(candidate.toLowerCase())) {
      label = parts[parts.length - 3] ?? parts[0]
    } else {
      label = candidate
    }
  } else {
    label = parts[0]
  }

  if (!label || label.length < 2) return null

  // Capitalize first letter, replace hyphens/dots with spaces
  return label.charAt(0).toUpperCase() + label.slice(1).replace(/[-_]/g, ' ')
}

// ─── Message body helpers ─────────────────────────────────────────────────────

/** Decode Gmail's URL-safe base64 body data. */
export function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/')
  try {
    return Buffer.from(padded, 'base64').toString('utf8')
  } catch {
    return ''
  }
}

/** Strip HTML tags and decode common entities for plain-text extraction. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Recursively extract plain text from a Gmail message part tree.
 * Prefers text/plain; falls back to text/html.
 */
export function extractBodyText(
  part: {
    mimeType?: string
    body?: { data?: string; size?: number }
    parts?: unknown[]
  } | undefined
): string | null {
  if (!part) return null

  if (part.mimeType === 'text/plain' && part.body?.data) {
    return decodeBase64Url(part.body.data)
  }

  if (part.mimeType === 'text/html' && part.body?.data) {
    return stripHtml(decodeBase64Url(part.body.data))
  }

  if (part.parts && Array.isArray(part.parts)) {
    // For multipart/alternative: prefer text/plain
    for (const child of part.parts as typeof part[]) {
      if ((child as { mimeType?: string }).mimeType === 'text/plain') {
        const text = extractBodyText(child as typeof part)
        if (text) return text
      }
    }
    // Fallback: first child that returns something
    for (const child of part.parts as typeof part[]) {
      const text = extractBodyText(child as typeof part)
      if (text) return text
    }
  }

  return null
}

// ─── Signature extraction ─────────────────────────────────────────────────────

/**
 * Best-effort signature extraction from plain text.
 * Returns up to 5 lines after the first recognized delimiter.
 */
export function extractSignature(plainText: string): string | null {
  const lines = plainText.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const pattern of SIGNATURE_DELIMITERS) {
      if (pattern.test(line)) {
        const sigLines = lines.slice(i, i + 6).filter((l) => l.trim().length > 0)
        if (sigLines.length > 0) {
          return sigLines.join('\n').slice(0, 500)
        }
        return null
      }
    }
  }

  return null
}

// ─── Participant extraction ───────────────────────────────────────────────────

/**
 * Extract all unique participants from a set of normalized messages.
 * Returns one ExtractedParticipant per unique email address,
 * with role = sender if they ever sent, else recipient, else cc.
 */
export function extractParticipants(
  messages: NormalizedMessage[],
  executiveEmail: string
): ExtractedParticipant[] {
  const participantMap = new Map<
    string,
    { email: string; name: string | null; body: string | null; roles: Set<string>; count: number }
  >()

  const executive = executiveEmail.toLowerCase()

  for (const msg of messages) {
    const add = (
      email: string,
      name: string | null,
      role: string,
      bodyForSig?: string | null
    ) => {
      const key = email.toLowerCase()
      if (key === executive) return // skip the executive themselves
      const existing = participantMap.get(key)
      if (existing) {
        existing.roles.add(role)
        existing.count += role === 'sender' ? 1 : 0
        if (!existing.name && name) existing.name = name
        if (!existing.body && bodyForSig) existing.body = bodyForSig
      } else {
        participantMap.set(key, {
          email: key,
          name,
          body: role === 'sender' ? (bodyForSig ?? null) : null,
          roles: new Set([role]),
          count: role === 'sender' ? 1 : 0,
        })
      }
    }

    add(msg.fromEmail, msg.fromName, 'sender', msg.bodyText)
    for (const e of msg.toEmails) add(e, null, 'recipient')
    for (const e of msg.ccEmails) add(e, null, 'cc')
  }

  return Array.from(participantMap.values()).map(({ email, name, body, roles, count }) => {
    const domain = extractDomain(email)
    const organization = extractOrganization(domain)
    const signatureHint = body ? extractSignature(body) : null

    const role: ExtractedParticipant['role'] = roles.has('sender')
      ? 'sender'
      : roles.has('recipient')
      ? 'recipient'
      : 'cc'

    return {
      contact: { email, displayName: name, domain, organization, signatureHint },
      role,
      messageCount: count,
    }
  })
}
