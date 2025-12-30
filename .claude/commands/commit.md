---
command: commit
description: Create and apply a succinct commit message for current changes
creation-date: 2025-11-09 10:55 UTC+0200
last-update: 2025-11-09 10:55 UTC+0200
---

## Description

Creates and applies a succinct commit message for the current changes using contextual prefixes: [dev], [clean], [doc], [fix], or [improve].

## Execution Steps

1. **Check Changes**
   - Run `git status` to see modified files
   - Run `git diff` to see actual changes
   - Run `git log --oneline -5` to see commit style

2. **Analyze and Select Prefix**
   - `[dev]`: New features, development work, dependencies
   - `[clean]`: Code cleanup, refactoring, removing code
   - `[doc]`: Documentation changes only
   - `[fix]`: Bug fixes, corrections
   - `[improve]`: Performance, optimization, enhancements

3. **Create Commit**
   - Write succinct message (one line preferred)
   - Use format: `[prefix] Brief description`
   - Stage changes with `git add`
   - Apply commit

4. **Verify**
   - Show commit with `git log -1 --stat`

## Output Format

```markdown
Changes: {file count} file(s)
Prefix: [{selected prefix}]
Message: {commit message}

✅ Commit applied
```

## Examples

- `[dev] Add user authentication endpoints`
- `[fix] Resolve null pointer in document upload`
- `[clean] Remove unused imports from conversation service`
- `[doc] Update API documentation for ratings endpoint`
- `[improve] Optimize database query performance`
