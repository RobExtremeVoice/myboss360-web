# Security Roadmap

This document describes the current security posture of MyBoss360 and the planned evolution toward enterprise-grade security, compliance, and trust infrastructure.

---

## Current Security Posture (v1.1)

The following controls are in place today:

| Control | Implementation | Status |
|---|---|---|
| Row-Level Security | All 27 database tables | ✅ Shipped |
| httpOnly auth cookies | `@supabase/ssr` (`httpOnly: true`) | ✅ Shipped |
| Supabase SSR auth (server-side session validation) | Every authenticated route | ✅ Shipped |
| Service-role key isolation | Server-side only, never in `NEXT_PUBLIC_*` env | ✅ Shipped |
| Auth middleware guard | All `/dashboard/*` routes | ✅ Shipped |
| Input sanitization (PostgREST filter injection) | Knowledge search service | ✅ Shipped |
| Workspace isolation | All queries scoped to `workspace_id` via RLS | ✅ Shipped |
| Soft deletes | All major entities (`deleted_at`) | ✅ Shipped |

---

## Roadmap

### Audit Logs

**Target:** v1.3 · Priority: P0

A tamper-evident audit log of all meaningful state changes in the platform. Required for enterprise sales, compliance attestation, and incident investigation.

**Scope:**
- Authentication events (login, logout, failed attempts, MFA challenges)
- Data mutations (create, update, delete on documents, contacts, deals, decisions)
- Permission changes (role assignments, ACL modifications)
- AI actions (messages sent, knowledge searches, agent task executions)
- Integration events (OAuth connections, sync runs, webhook deliveries)
- Administrative actions (provisioning, workspace changes)

**Schema (planned):**
```sql
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id),
    organization_id UUID REFERENCES organizations(id),
    actor_id    UUID REFERENCES profiles(id),
    actor_type  TEXT NOT NULL,  -- 'user' | 'agent' | 'system'
    event_type  TEXT NOT NULL,  -- 'document.created', 'deal.deleted', etc.
    resource_type TEXT,
    resource_id UUID,
    before_state JSONB,
    after_state  JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Append-only: no UPDATE, no DELETE via RLS
```

**Properties:** append-only (RLS denies UPDATE/DELETE), indexed for efficient time-range queries, exportable as JSON or CSV.

---

### Multi-Factor Authentication (MFA)

**Target:** v1.x · Priority: P1

Add TOTP-based MFA using Supabase's built-in MFA support.

**Implementation:**
- Enroll TOTP authenticator (QR code flow) via Supabase Auth MFA API
- Require MFA on next login after enrollment
- Recovery codes (one-time backup tokens)
- Workspace admin can require MFA for all members (enforce MFA policy)
- Graceful fallback to email OTP for users without authenticator app

---

### Single Sign-On (SSO)

**Target:** Enterprise tier · Priority: P1

SAML 2.0 and OIDC support for enterprise customers who manage identity via their own IdP (Okta, Microsoft Entra ID, Google Workspace, Auth0).

**Flow:**
```
Enterprise user navigates to login
    │
    ▼
MyBoss360 detects enterprise email domain
    │
    ▼
Redirect to configured IdP (SAML / OIDC)
    │
    ▼
IdP authenticates + returns assertion
    │
    ▼
MyBoss360 provisions / syncs user and creates session
```

**Requirements:**
- Per-organization IdP configuration (entity ID, metadata URL, certificate)
- JIT (just-in-time) user provisioning on first SSO login
- SCIM 2.0 user sync (planned alongside SSO)
- Domain verification (prevent domain takeover attacks)

---

### Role-Based Access Control (RBAC)

**Target:** v1.3 · Priority: P1

Extend the current membership roles system into a full RBAC model with granular permissions.

**Permission model:**

| Resource | Actions |
|---|---|
| Documents | `read`, `write`, `delete`, `share` |
| CRM | `read`, `write:contacts`, `write:deals`, `delete` |
| Workspace | `admin`, `invite`, `remove_member` |
| AI assistant | `use`, `manage_history` |
| Automations | `view`, `create`, `execute`, `delete` |
| Knowledge | `read`, `write`, `delete`, `manage_permissions` |

**Predefined roles (planned):**

| Role | Description |
|---|---|
| `owner` | Full control over the workspace |
| `admin` | Manage members, roles, and integrations |
| `executive` | Full read/write on all business data |
| `manager` | Read/write on CRM and tasks; read on finance |
| `viewer` | Read-only on approved data sets |
| `agent` | System role for AI agents; scoped to task type |

Custom roles are composable from the base permission set.

---

### Enterprise Permissions

**Target:** Enterprise tier · Priority: P1

Extends RBAC with enterprise-specific controls:

- **IP allowlisting** — restrict workspace access to corporate IP ranges
- **Session timeout policies** — configurable idle timeout per workspace
- **Data export controls** — restrict which roles can export bulk data
- **AI access controls** — enable/disable AI features per role or workspace
- **Third-party integration approval** — workspace admin must approve each OAuth connection
- **Agent action scope limits** — per-agent permission boundaries (e.g., Sales Agent cannot access Finance data)

---

### Encryption

**Target:** Enterprise tier · Priority: P1

**Encryption at rest:**
- All data at rest is encrypted by Supabase (AES-256 at the infrastructure level)
- Sensitive columns (OAuth tokens, credentials) encrypted at the application layer using Supabase Vault before storage
- Encryption keys are per-workspace (envelope encryption)

**Encryption in transit:**
- TLS 1.3 enforced on all connections
- HSTS with long max-age
- Supabase Realtime connections over WSS

**Key management (planned):**
- Customer-managed encryption keys (CMEK) for enterprise tier
- Key rotation without re-provisioning the workspace
- HSM-backed key storage for enterprise customers

---

### Compliance

**Target:** Enterprise tier · Priority: P0 (for enterprise sales)

**SOC 2 Type II**

SOC 2 Type II attestation demonstrates that MyBoss360's security controls operate effectively over a sustained period (typically 6–12 months of audit window).

**Trust Service Criteria to address:**

| Criterion | Description | Status |
|---|---|---|
| Security | Protection against unauthorized access | 🔄 Ongoing (RLS, auth, encryption) |
| Availability | System uptime and performance | 🗓 Planned (SLA monitoring, incident response) |
| Confidentiality | Protection of confidential information | 🗓 Planned (RBAC, data classification) |
| Processing Integrity | System processes are complete and accurate | 🗓 Planned (audit logs, idempotency) |
| Privacy | Personal information handling | 🗓 Planned (GDPR controls, data retention) |

**GDPR / Data Privacy**

For EU customers and any data involving EU residents:
- Data Processing Agreements (DPA) available on request
- Data residency options (EU-hosted Supabase project)
- Right to erasure: user data deletion pipeline
- Data export: workspace data export in standard formats
- Retention policies: configurable per-workspace data retention

**HIPAA (future consideration)**
Not in scope for current roadmap. If healthcare use cases emerge, evaluate HIPAA-compliant infrastructure (Supabase Business tier + BAA).

---

## Security Development Lifecycle

These practices govern all development:

| Practice | Implementation |
|---|---|
| Dependency vulnerability scanning | Automated on PRs (planned: Dependabot or Snyk) |
| Secret scanning | Never commit credentials; `.env.local` gitignored |
| Input validation | All API routes validate inputs before processing |
| Output encoding | Next.js default XSS protection + typed API responses |
| SQL injection | Supabase parameterized queries; no raw SQL in app code |
| PostgREST injection | User input sanitized before filter interpolation |
| SSRF prevention | All external HTTP calls use an allowlist of domains |
| Security review | Automated per-commit security scan (PostToolUse hook) |
| Incident response | Documented runbook (planned: `docs/security/incident-response.md`) |

---

## Security Contact

To report a security vulnerability: email **security@myboss360.com** (planned).

Bug bounty program: under evaluation for post-v1.3 launch.
