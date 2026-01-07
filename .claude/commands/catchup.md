# Catchup Command

Analyze the current working state and recent development history to identify what was worked on in previous session(s).

## Steps to Execute

1. **Check uncommitted changes**:
   - Run `git status` to see modified, staged, and untracked files
   - Run `git diff` to see unstaged changes
   - Run `git diff --staged` to see staged changes

2. **Review recent commits**:
   - Run `git log -10 --oneline --graph` to see last 10 commits with branch visualization
   - Run `git log -3 --stat` to see detailed changes in last 3 commits

3. **Analyze the context**:
   - Identify the main areas of the codebase being modified
   - Determine the feature/bug/task being worked on based on:
     - File paths and names
     - Commit messages
     - Nature of changes (new files, modifications, deletions)
     - Patterns in the changes

4. **Present findings**:
   - Summarize what appears to have been worked on
   - Highlight any incomplete work or work-in-progress
   - Note any apparent blockers or issues based on change patterns

5. **Ask clarifying questions if**:
   - The changes span multiple unrelated areas
   - Commit messages are unclear or generic
   - There's a mix of features and fixes that don't form a coherent story
   - Significant changes lack commits or commits lack corresponding changes
   - You cannot determine a clear work context

## Important Notes

- Use the Bash tool to run all git commands in parallel where possible
- Read relevant changed files if needed to understand context better
- Be concise but thorough in your analysis
- Focus on actionable insights about what was being worked on
- If the work context is clear, don't ask unnecessary questions
