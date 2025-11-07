# Claude Code Memory Issue - GitHub Issue Draft

## Issue Title
Claude Code stores all bash output in memory causing 90GB+ memory usage and crashes

## Issue Body

### Description
Claude Code appears to store all bash command output in memory for the entire session, leading to catastrophic memory usage that can reach 90GB+ and crash the application. This makes Claude Code unusable for real development workflows involving tests, builds, or any commands with substantial output.

### Steps to Reproduce
1. Start a Claude Code session
2. Run `npm test` on a project with comprehensive test suites (150+ tests)
3. Run `npm run build` on a medium-sized project
4. Continue working for 30-50 messages
5. Watch system memory usage climb to 90GB+

### Expected Behavior
- Bash output should be streamed and discarded after display
- Old command outputs should be garbage collected
- Memory usage should remain reasonable (<2GB for typical sessions)

### Actual Behavior
- ALL bash output is retained in memory permanently
- Memory usage grows linearly with command output
- Sessions become unusable after running tests/builds
- Only fix is restarting Claude Code entirely

### Impact
This issue makes Claude Code unsuitable for professional development work. We've had to implement extreme workarounds:

```bash
# Forced to use these truncated commands to prevent crashes:
npm test 2>&1 | tail -30        # Instead of npm test
npm run build 2>&1 | grep -i "error\|warning" || echo "✅"  # Instead of npm run build
npm install --silent             # Instead of npm install
```

### System Information
- OS: macOS 15.6.1 (Darwin 24.6.0)
- Platform: darwin (arm64)
- Claude Code Version: [current version]
- Typical memory usage: 90GB+ after running tests/builds

### Suggested Solutions
1. **Stream output without storing**: Display bash output but don't retain it
2. **Output size limits**: Auto-truncate stored output after X MB
3. **Garbage collection**: Discard output older than N messages
4. **User preferences**: Add settings for memory management:
   - `claude.maxOutputRetention: 10MB`
   - `claude.discardOldOutput: true`
   - `claude.streamOnlyMode: true`

### Workaround (Not Acceptable Long-term)
Currently forced to:
- Pipe all commands through `tail`/`grep`
- Restart Claude Code when memory exceeds limits
- Avoid running tests/builds entirely
- Keep sessions under 30 messages

### Additional Context
This issue has been persistent enough that we've had to document extensive memory management rules in our project. Multiple sessions have crashed with 90GB+ memory usage. This is a critical blocker for using Claude Code in production development.

---

## How to Submit This Issue

1. **Go to the Claude Code GitHub Issues page:**
   ```
   https://github.com/anthropics/claude-code/issues
   ```

2. **Click "New Issue"** (green button on the right)

3. **Copy the title and body from above**

4. **Add labels if available:**
   - `bug`
   - `performance`
   - `memory-leak`
   - `critical`

5. **Submit the issue**

6. **Follow up with:**
   - Screenshots of memory usage if you have them
   - Any crash logs from Console.app (on macOS)
   - Your CLAUDE.md file as evidence of the workarounds needed

### Alternative: Command Line Submission
If you have GitHub CLI installed:
```bash
gh issue create \
  --repo anthropics/claude-code \
  --title "Claude Code stores all bash output in memory causing 90GB+ memory usage and crashes" \
  --body-file claude-code-memory-issue.md \
  --label "bug,performance"
```