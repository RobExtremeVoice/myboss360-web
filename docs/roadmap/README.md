# MyBoss360 Product Roadmap

MyBoss360 is an **Executive Operating System** — an AI-native platform that gives executives and business leaders a unified command centre for decisions, intelligence, and team coordination. This directory contains the canonical roadmap documentation for the platform.

---

## Navigation

| Document | Audience | Purpose |
|---|---|---|
| [RELEASE_BOARD.md](RELEASE_BOARD.md) | All | At-a-glance view of all planned releases and their status |
| [CHANGELOG.md](CHANGELOG.md) | All | Detailed history of every shipped release |
| [PRODUCT_VISION.md](PRODUCT_VISION.md) | Investors · Execs · New hires | Why MyBoss360 exists, the Executive OS thesis, long-term vision |
| [FEATURE_MATRIX.md](FEATURE_MATRIX.md) | Product · Engineering | Full feature inventory with status, release, priority, and dependencies |
| [AI_ROADMAP.md](AI_ROADMAP.md) | Engineering · CTO | Evolution of the AI layer from mock provider to multi-agent system |
| [SECURITY_ROADMAP.md](SECURITY_ROADMAP.md) | Engineering · Enterprise customers | Security, compliance, and enterprise trust roadmap |
| **RELEASES/** | Engineering · Investors | Per-release objectives, milestones, and success criteria |

### Individual Release Documents

| File | Version | Theme |
|---|---|---|
| [RELEASES/v1.0.md](RELEASES/v1.0.md) | v1.0 | Executive Onboarding & Workspace Provisioning |
| [RELEASES/v1.1.md](RELEASES/v1.1.md) | v1.1 | Knowledge Engine (RAG Foundation) |
| [RELEASES/v1.2.md](RELEASES/v1.2.md) | v1.2 | Connected Executive (Google Workspace) |
| [RELEASES/v1.3.md](RELEASES/v1.3.md) | v1.3 | Knowledge Intelligence (Embeddings & Vector Search) |
| [RELEASES/v1.4.md](RELEASES/v1.4.md) | v1.4 | Executive Automation (Workflow & Approval Engine) |
| [RELEASES/v2.0.md](RELEASES/v2.0.md) | v2.0 | Executive Multi-Agent System |

---

## Release Strategy

### Philosophy

MyBoss360 follows a **value-first, layered release strategy**. Each minor version ships a complete, usable vertical — executives get immediate value at every version boundary, while each release also lays infrastructure for the next.

```
v1.x  →  Individual Executive Intelligence
v2.x  →  Multi-Agent Executive Teams
v3.x  →  Enterprise Network Intelligence  (planned)
```

### Versioning

| Segment | Meaning | Example trigger |
|---|---|---|
| **Major** (`v2.0`) | Platform generation shift — architecture or paradigm change | Single-agent → Multi-agent |
| **Minor** (`v1.2`) | New capability vertical shipped to all users | Google Workspace integration |
| **Patch** (`v1.1.1`) | Bug fixes, security patches, minor improvements | Filter injection fix |

### Release Cadence (target)

| Phase | Target cadence |
|---|---|
| v1.x minor releases | 6–10 weeks per release |
| v2.0 | 6 months of focused development after v1.5 |
| Patches | On-demand (security: within 48 h) |

### Environments

| Environment | Branch | Purpose |
|---|---|---|
| `production` | `main` (tagged) | Live product |
| `staging` | `main` (untagged HEAD) | Final QA before release |
| `development` | Feature branches | Active development |

See [environments.md](../environments.md) for infrastructure detail.

---

## Current Status

**Shipped:** v0.1 → v1.1  
**In development:** v1.2 (Connected Executive)  
**Next planned:** v1.3 (Knowledge Intelligence)

For the full status of every feature see [FEATURE_MATRIX.md](FEATURE_MATRIX.md).
