<p align="center">
  <img src="docs/images/cover.jpeg" alt="claude-code-statusline" width="100%">
</p>

# ◆ claude-code-statusline

**English** | [繁體中文](README.zh-TW.md)

A beautiful, information-dense status line for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — the CLI tool by Anthropic.

Turn the blank status bar into a real-time dashboard: model, context usage with gradient progress bar, cost, duration, git branch, rate limits, and more.

## Preview

**Normal** — Context at 42%, everything is fine

![Normal](docs/images/normal.svg)

**Warning** — Context at 75%, pay attention

![Warning](docs/images/warning.svg)

**Danger** — Context at 92%, almost full

![Danger](docs/images/danger.svg)

**Startup** — Clean, no noise

![Startup](docs/images/startup.svg)

## Features

| Feature | Description |
|---------|-------------|
| **Gradient progress bar** | True-color (24-bit) gradient from green → yellow → red. Falls back to ANSI 256 colors or ASCII automatically. |
| **Smart hiding** | Zero values (`+0/-0`, `0m0s`, rate limits) are hidden. `$0.00` stays but dims. |
| **Dynamic cost coloring** | Yellow by default, red when > $10. |
| **Git branch + dirty** | Shows branch name with `*` for uncommitted changes. Cached for 5 seconds to stay fast. |
| **Rate limits** | 5-hour and 7-day usage (Claude Pro/Max only). Red when > 80%. |
| **Agent / Worktree indicator** | `⚙ code-reviewer` or `⚙ worktree:my-feature` — only when active. |
| **Context window size** | Shows `1M` or `200k` only when not already in the model name. |
| **Brand identity** | `◆` diamond in Anthropic purple (#7266EA). |
| **3-tier rendering** | True color → ANSI → ASCII. Works in any terminal. |
| **Nerd Font support** | Optional: ``, `󰔟`, `` icons. Set `CLAUDE_STATUSLINE_NERDFONT=1`. |
| **Powerline separators** | Optional: `` arrows. Set `CLAUDE_STATUSLINE_POWERLINE=1`. |
| **Boot cost indicator** | Shows how much context your startup config (CLAUDE.md, rules, memory, skills) consumes — before you even ask a question. Progress bar splits into dark (boot) vs gradient (chat). |
| **< 50ms** | Single `jq` call + cached git. No perceptible lag. |

## Installation

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- `jq` — install with `brew install jq` (macOS) or `apt install jq` (Linux)

### Quick install

```bash
git clone https://github.com/kcchien/claude-code-statusline.git
cd claude-code-statusline
./install.sh
```

### Manual install

```bash
# 1. Copy the script
cp statusline.sh ~/.claude/statusline.sh
chmod +x ~/.claude/statusline.sh

# 2. Add to ~/.claude/settings.json
```

Add this to your `settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "timeout": 10
  }
}
```

Restart Claude Code. The status line appears after your first interaction.

## Configuration

All configuration is via environment variables. Add them to your `~/.zshrc` or `~/.bashrc`:

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_STATUSLINE_ASCII` | `0` | Set to `1` for pure ASCII mode (no Unicode) |
| `CLAUDE_STATUSLINE_NERDFONT` | `0` | Set to `1` to enable [Nerd Font](https://www.nerdfonts.com/) icons |
| `CLAUDE_STATUSLINE_POWERLINE` | follows NERDFONT | Set to `1` for Powerline arrow separators |
| `COLORTERM` | (system) | `truecolor` or `24bit` enables gradient progress bar |

Example:

```bash
# In ~/.zshrc
export CLAUDE_STATUSLINE_NERDFONT=1  # Enable Nerd Font icons + Powerline arrows
```

## Boot cost indicator

Most users don't realize how much context their startup configuration consumes. A large `CLAUDE.md`, many rules, memory files, and skills can eat 10–30% of your context window before you even start working.

This fork adds a **boot cost snapshot**: the first time the status line runs in a session, it records the current context usage as your "boot cost." From then on:

- The **progress bar** splits into three zones: dark gray (boot) → gradient (chat) → empty
- A **`(boot N%)`** label appears next to the percentage, in gray

```
◆ Opus 4 │ ██████░░░░ 45% (boot 27%) 1M │ $1.20 │ 10m0s
           ^^          ^^^^
           boot(dark)  chat(gradient)
```

The boot snapshot is stored in `/tmp/claude-statusline-boot` and resets with each new session.

## How it works

Claude Code's `statusLine` hook sends a JSON payload to your script via stdin after every assistant response. The JSON contains the full session state — model, tokens, cost, git info, rate limits, etc.

This script:

1. **Single `jq` call** (~3ms) — parses all 14 fields at once
2. **Git cache** (~0ms on cache hit, ~40ms on refresh) — dirty check cached for 5 seconds in `/tmp/`
3. **Smart assembly** — only non-zero sections are rendered
4. **`printf '%b'`** — interprets ANSI escape codes for the final colored output

Total: **< 50ms** end-to-end.

### Available data from Claude Code

The status line receives [these JSON fields](https://code.claude.com/docs/en/statusline#available-data):

- `model.display_name` — current model
- `context_window.used_percentage` — context usage (0-100)
- `cost.total_cost_usd` — session cost
- `cost.total_duration_ms` — elapsed time
- `cost.total_lines_added/removed` — code changes
- `rate_limits.five_hour/seven_day.used_percentage` — rate limits
- `worktree.branch/name` — git worktree info
- `agent.name` — subagent name
- ...and more. See the [official docs](https://code.claude.com/docs/en/statusline).

## Testing

Run the test script to see all display modes:

```bash
chmod +x examples/test-mock.sh
./examples/test-mock.sh          # All scenarios
./examples/test-mock.sh normal   # Just normal state
./examples/test-mock.sh danger   # Just danger state
./examples/test-mock.sh ascii    # ASCII fallback
```

## Bash 3.2 compatibility

This script is designed for macOS's default bash 3.2. Key design decisions:

- **Lookup table for progress bar** — avoids UTF-8 substring issues across bash versions
- **Line-by-line `read`** — bash 3.2's `IFS` + `read` silently collapses empty delimited fields. Using one `read` per line avoids this.
- **Sentinel value in `jq`** — `$()` strips trailing newlines, which eats the last field if it's empty. A `"END"` sentinel prevents this.

## License

MIT — see [LICENSE](LICENSE).

## Credits

Built with [Claude Code](https://claude.ai/claude-code) (Opus 4.6, 1M context) in a single session. The status line was designed iteratively — from functional prototype to aesthetic dashboard — through collaborative conversation.

Inspired by the [official statusline documentation](https://code.claude.com/docs/en/statusline) and community projects like [ccstatusline](https://github.com/sirmalloc/ccstatusline) and [starship-claude](https://github.com/martinemde/starship-claude).
