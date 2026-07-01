# Release Schedule

| Release | Theme | Target Date | Issues | SP | Status |
|---|---|---|---|---|---|
| v1.0 | Executive Onboarding | 2026-06-15 | 8 | 34 | ✅ Shipped |
| v1.1 | Knowledge Engine | 2026-07-01 | 10 | 40 | ✅ Shipped |
| v1.2 | Connected Executive | 2026-09-15 | 22 | 91 | 🗓 Planned |
| v1.3 | Knowledge Intelligence | 2026-11-30 | 17 | 75 | 🗓 Planned |
| v1.4 | Executive Automation | 2027-02-28 | 13 | 72 | 🗓 Planned |
| v1.5 | Executive Voice | 2027-05-31 | 12 | 62 | 🗓 Planned |
| v2.0 | Multi-Agent System | 2027-09-30 | 19 | 117 | 🗓 Planned |

For detailed release specs, see [../roadmap/RELEASES/](../roadmap/RELEASES/).

## Release Checklist Template

Before tagging any release:

- [ ] All milestone issues closed or explicitly deferred
- [ ] `pnpm lint` passes with 0 errors
- [ ] `pnpm build` passes with 0 errors
- [ ] `pnpm test` passes, coverage ≥ 70%
- [ ] Security review completed (no open MEDIUM+ findings)
- [ ] CHANGELOG.md updated
- [ ] Docs updated for all user-facing changes
- [ ] Staging environment verified end-to-end
- [ ] Git tag created: `vMAJOR.MINOR.PATCH`
- [ ] GitHub Release created with changelog extract
