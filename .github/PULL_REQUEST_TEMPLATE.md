# Pull Request

## Summary

<!-- 1–3 bullets describing what this PR does and why. -->

- 
- 

## Related Issues

<!-- Link every issue this PR closes or contributes to. -->

Closes #  
Contributes to #

## Type of Change

- [ ] Feature (new capability)
- [ ] Bug fix (corrects a defect)
- [ ] Refactor (no behavior change)
- [ ] Performance improvement
- [ ] Documentation
- [ ] Infrastructure / tooling
- [ ] Security fix

## Changes Made

<!-- List the significant files changed and what changed in each. -->

| File | Change |
|---|---|
|  |  |

## Testing

### Test Plan

<!-- Describe exactly how to test this PR. What to click, what to expect. -->

1. 
2. 
3. 

### Test Coverage

- [ ] Unit tests added / updated
- [ ] Integration tests added / updated
- [ ] Manual testing performed (describe below)
- [ ] No tests required (explain why)

### Manual Testing Steps

```
<!-- Step-by-step instructions for a reviewer to verify the change works. -->
```

## Database Changes

- [ ] No database changes
- [ ] New migration added: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- [ ] Migration is backward-compatible
- [ ] Migration has been tested locally

## Security Checklist

- [ ] No secrets committed (API keys, tokens, passwords)
- [ ] User input is validated before processing
- [ ] RLS policies updated if new tables added
- [ ] No `NEXT_PUBLIC_` prefix on server-only env vars
- [ ] Auth guard present on new API routes

## Performance

- [ ] No significant performance impact
- [ ] Database queries indexed appropriately
- [ ] API response cached where appropriate
- [ ] Large data sets paginated

## Breaking Changes

- [ ] No breaking changes
- [ ] Breaking change (describe migration path below)

<!-- If breaking: what do callers need to update? -->

## Screenshots / Recordings

<!-- Attach screenshots or screen recordings for UI changes. -->

## Checklist

- [ ] `pnpm lint` passes with 0 errors
- [ ] `pnpm build` passes with 0 errors
- [ ] `pnpm test` passes (coverage ≥ 70%)
- [ ] PR description accurately reflects all changes
- [ ] Commit messages are clear and conventional
- [ ] Self-review completed
- [ ] Documentation updated (if user-facing change)
