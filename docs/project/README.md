# MyBoss360 — Project Management

This directory contains the GitHub project management layer for MyBoss360: sprint plans, epics, milestones, labels, and issue specifications.

---

## Navigation

| Document | Purpose |
|---|---|
| [RELEASES.md](RELEASES.md) | Release schedule with target dates and status |
| [EPICS.md](EPICS.md) | All epics with child issue lists |
| [MILESTONES.md](MILESTONES.md) | GitHub milestones with targets and success criteria |
| [LABELS.md](LABELS.md) | Label taxonomy and application guide |
| [SPRINTS.md](SPRINTS.md) | Sprint definitions, goals, and velocity tracking |
| [../issues/](../issues/) | Full issue specifications by sprint |

---

## Scripts

| Script | Purpose |
|---|---|
| `scripts/create-labels.sh` | Provision all labels on GitHub via `gh` CLI |
| `scripts/create-milestones.sh` | Create all milestones on GitHub via `gh` CLI |
| `scripts/generate-github-issues.sh` | Create all 82 issues on GitHub with labels and milestones |

### Quick Setup

```bash
# 1. Authenticate with GitHub CLI
gh auth login

# 2. Create labels
bash scripts/create-labels.sh

# 3. Create milestones
bash scripts/create-milestones.sh

# 4. Generate all issues
bash scripts/generate-github-issues.sh
```

---

## Issue Lifecycle

```
New → Open → In Progress → Needs Review → Merged → Closed
         ↓
       Blocked (label)
         ↓
       Unblocked → In Progress
```

| Status | Label | Who acts |
|---|---|---|
| New | (none) | Triager assigns priority + sprint |
| Open | sprint label | Engineer picks up |
| In Progress | `in-progress` | Engineer |
| Needs Review | `needs-review` | Reviewer |
| Merged | (closed on merge) | Auto-closed via PR |
| Blocked | `blocked` | Engineer + PM unblock |

---

## Sprint Planning

- Sprint duration: **2 weeks**
- Velocity target: **30–40 story points per sprint**
- Sprint review: last Friday of each sprint
- Retrospective: immediately after sprint review
- Issue grooming: Wednesday before new sprint starts

See [SPRINTS.md](SPRINTS.md) for the full sprint schedule.
