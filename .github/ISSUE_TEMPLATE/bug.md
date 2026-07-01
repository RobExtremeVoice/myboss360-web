---
name: Bug Report
about: Report a defect or unexpected behavior in MyBoss360
title: '[BUG] '
labels: bug
assignees: ''
---

## Summary

<!-- One sentence description of the bug. -->

## Steps to Reproduce

1. 
2. 
3. 

## Expected Behavior

<!-- What should happen. -->

## Actual Behavior

<!-- What actually happens. Include error messages, stack traces, screenshots. -->

## Environment

- **Browser / Client:** 
- **Node version:** 
- **Commit / tag:** 
- **Workspace ID (if relevant):** 

## Error Output

```
<!-- Paste error messages, console output, or stack traces here. -->
```

## Root Cause Hypothesis

<!-- Optional: your initial read on what's wrong and where. -->

## Acceptance Criteria

- [ ] The described behavior no longer occurs
- [ ] A regression test is added that fails before the fix and passes after
- [ ] No related functionality is broken

## Definition of Done

- [ ] Root cause identified and documented in PR
- [ ] Fix implemented and code-reviewed
- [ ] Regression test added
- [ ] `pnpm lint` passes with 0 errors
- [ ] `pnpm build` passes with 0 errors
- [ ] Tested in staging environment

## Priority

`<!-- P0 (production down) | P1 (major bug, workaround exists) | P2 (minor) -->`

## Story Points

`<!-- 1 | 2 | 3 | 5 | 8 -->`
