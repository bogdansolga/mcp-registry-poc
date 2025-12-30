# Git Hooks

This directory contains git hooks that are **tracked in version control** and shared across the team.

## Quick Start

After cloning the repository, install the hooks:

```bash
pnpm run hooks:install
```

This will copy hooks from `scripts/git-hooks/` to `.git/hooks/` and make them executable.

## Available Hooks

### pre-commit

Runs before every `git commit`:
- TypeScript type checking (production code only)
- Biome linting for unused code
- Blocks commit if production code has issues
- Test file issues show as warnings only

**Bypass:** `git commit --no-verify`

### pre-push

Runs before every `git push`:
- TypeScript type checking
- Biome linting
- Unit tests
- All checks run in parallel for speed
- **LOCAL ONLY** - automatically skips in CI/CD environments

**Bypass:** `git push --no-verify`

## How It Works

1. **Tracked Hooks**: This directory (`scripts/git-hooks/`) is tracked in git
2. **Installation**: The `pnpm run hooks:install` script copies hooks to `.git/hooks/`
3. **Local Execution**: Hooks in `.git/hooks/` execute automatically on git operations
4. **Team Enforcement**: Everyone on the team gets the same hooks after running the install command

## Updating Hooks

If you modify a hook in `scripts/git-hooks/`:

1. Edit the hook file in this directory
2. Commit your changes
3. Push to the repository
4. Team members run `pnpm run hooks:install` to get the updates

The installation script is smart and will only update hooks that have changed.

## CI/CD Considerations

Git hooks do **NOT** run in CI/CD pipelines because:
- They're in `.git/hooks/` (local directory, not tracked)
- Each developer's local repository has their own `.git/hooks/`

However, our hooks include CI detection to prevent issues:
- Pre-push hook checks for `CI`, `GITHUB_ACTIONS`, `GITLAB_CI`, `JENKINS_URL` env vars
- Automatically skips in CI environments

## Verifying All Checks

Run all checks manually (same as what hooks run):

```bash
pnpm run verify:all
```

This runs:
- TypeScript type checking
- Biome linting
- All unit tests

**Individual Checks:**
```bash
pnpm run type-check   # Pre-commit: TypeScript
pnpm run lint         # Pre-commit: Linting
pnpm run test         # Pre-push: Unit tests
```

## Troubleshooting

### Hooks not running after install

Check if they're executable:
```bash
ls -l .git/hooks/
```

Re-run the installation:
```bash
pnpm run hooks:install
```

### Want to disable a hook temporarily

Rename it in `.git/hooks/`:
```bash
mv .git/hooks/pre-push .git/hooks/pre-push.disabled
```

Or use `--no-verify` when committing/pushing.

### Getting hook updates

If a teammate updates a hook:
```bash
git pull
pnpm run hooks:install  # Get the latest hooks
```

## Best Practices

**DO:**
- Run `pnpm run hooks:install` after cloning the repo
- Run it again after pulling hook updates
- Fix issues locally before committing/pushing
- Use `--no-verify` sparingly and with good reason

**DON'T:**
- Modify hooks directly in `.git/hooks/` (changes won't be tracked)
- Bypass hooks habitually
- Forget to run hooks:install after pulling changes

## New Team Member Onboarding

Add this to your onboarding checklist:

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Install git hooks: `pnpm run hooks:install`
4. Verify hooks work: Try making a commit with an unused variable
