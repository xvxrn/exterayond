---
name: tweb-bugs
description: "Parse, deduplicate, and prioritize bugs from GitHub (morethanwords/tweb) and bugs.telegram.org (WebK). Use when the user asks to analyze tweb bugs, triage issues, or review the tweb bug backlog."
user-invocable: true
argument-hint: "[--refresh] [--top N] [--label LABEL] [--platform github|telegram|all] [--status open|fixed|all] [--detailed]"
allowed-tools: ["Read", "Write", "Bash(*)", "Glob", "Grep", "WebFetch", "Agent"]
---

# /tweb-bugs — Triage & Prioritize tweb Bugs (GitHub + bugs.telegram.org)

Fetch open bugs from **both** platforms, normalize to a unified format, deduplicate, score, and produce a prioritized bug report.

## Platforms

| Platform | Source | Tag/Filter |
|----------|--------|-----------|
| **GitHub** | `morethanwords/tweb` open issues | Exclude PRs, `enhancement`, `feature` labels |
| **Telegram** | `bugs.telegram.org/?tag_ids=40` | WebK tag (id=40) |

## Arguments

- `--refresh` — force re-fetch from all platforms (ignore cache)
- `--top N` — show only top N bugs (default: show all)
- `--label LABEL` — filter by GitHub label
- `--platform github|telegram|all` — which platform to fetch/report (default: `all`)
- `--status open|fixed|all` — filter by status (default: `open` for GitHub, `all` for Telegram)
- `--detailed` — for Telegram bugs, fetch each individual page for full description, votes, device info (slower but more accurate scoring)
- No arguments — use cache if fresh (< 24h), otherwise re-fetch.

## Cache Location

`.Codex/bugs-cache/` (relative to the repo root)

Stored **per-platform** in separate subdirectories:

```
bugs-cache/
├── github/
│   ├── issues-raw.json      — raw GitHub API response (unified format)
│   ├── last-fetch.txt        — ISO timestamp of last fetch
│   └── issues-scored.json    — analyzed, scored issues
├── telegram/
│   ├── issues-raw.json      — scraped issues (unified format)
│   ├── last-fetch.txt        — ISO timestamp of last fetch
│   └── issues-scored.json    — analyzed, scored issues
├── report.md                 — combined prioritized report
└── report-tmp/               — per-run scratch files
```

## Unified Bug Format

Both platforms produce the same JSON shape in their `issues-raw.json`:

```json
{
  "id": "github-123",
  "platform": "github",
  "number": 123,
  "title": "Bug title",
  "body": "Full description text",
  "status": "open",
  "url": "https://github.com/morethanwords/tweb/issues/123",
  "created_at": "2026-03-01T12:00:00Z",
  "updated_at": "2026-03-05T15:30:00Z",
  "votes": {"up": 5, "down": 0, "total": 5},
  "comments_count": 3,
  "tags": ["WebK"],
  "labels": ["bug"],
  "author": "username",
  "device_info": "Chrome 146, Windows",
  "steps_to_reproduce": "1. Open chat\n2. Click send"
}
```

### Field mapping

| Unified field | GitHub source | Telegram source |
|--------------|--------------|-----------------|
| `id` | `"github-{number}"` | `"telegram-{card_id}"` |
| `platform` | `"github"` | `"telegram"` |
| `number` | issue number | card ID from `data-card-id` |
| `title` | `title` | `.bt-card-title` |
| `body` | `body` | `.bt-card-preview` (list) or `.bt-issue-text` (detailed) |
| `status` | `state` (open/closed) | `.bt-card-thumb-status` → normalized |
| `url` | `html_url` | `https://bugs.telegram.org/c/{id}` |
| `created_at` | `created_at` | `time[datetime]` |
| `updated_at` | `updated_at` | same as `created_at` (not available in list) |
| `votes.up` | `reactions.+1` + `reactions.heart` | like `data-value` (detailed only) |
| `votes.down` | `reactions.-1` | dislike `data-value` (detailed only) |
| `votes.total` | `reactions.total_count` | up + down |
| `comments_count` | `comments` | `.cd-issue-replies .value` or `.bt-header-cnt` |
| `tags` | — | `["WebK"]` |
| `labels` | `labels[].name` | — |
| `author` | `user.login` | `.bt-issue-author` (detailed only) |
| `device_info` | parsed from body | parsed from body |
| `steps_to_reproduce` | parsed from body | parsed from body |

## Workflow

### Step 1: Check Cache

For each requested platform:
1. Read `{platform}/last-fetch.txt`. If it exists and is < 24h old AND `--refresh` was NOT passed, skip fetching that platform.
2. Otherwise proceed to fetch.

### Step 2: Fetch Issues

#### GitHub

```bash
gh api --paginate "repos/morethanwords/tweb/issues?state=open&per_page=100" > github/issues-raw-api.json
```

Then normalize each issue to unified format:

```javascript
// Pseudocode for GitHub normalization
for each issue in raw_response:
  if issue.pull_request: skip  // PRs appear in issues API
  if issue.labels includes "enhancement" or "feature": skip

  unified = {
    id: "github-" + issue.number,
    platform: "github",
    number: issue.number,
    title: issue.title,
    body: issue.body,
    status: issue.state,  // "open" or "closed"
    url: issue.html_url,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    votes: {
      up: (issue.reactions["+1"] || 0) + (issue.reactions.heart || 0),
      down: issue.reactions["-1"] || 0,
      total: issue.reactions.total_count || 0
    },
    comments_count: issue.comments,
    tags: [],
    labels: issue.labels.map(l => l.name),
    author: issue.user.login,
    device_info: extractDeviceInfo(issue.body),
    steps_to_reproduce: extractSteps(issue.body)
  }
```

Save normalized array to `github/issues-raw.json`. Update `github/last-fetch.txt`.

#### Telegram (bugs.telegram.org)

Use the scraper script:

```bash
node "$SKILL_DIR/fetch-telegram-bugs.mjs" --cache-dir "$CACHE_DIR/telegram" [--detailed] [--status STATUS]
```

The script (`fetch-telegram-bugs.mjs` in the skill directory):
1. Fetches `https://bugs.telegram.org/?tag_ids=40&sort=time&type=issues` to get session hash + cookies
2. Parses all cards from initial HTML (50 items)
3. Paginates via POST to `/api?hash=...` with `method=searchIssues`, `offset=N`
4. Extracts: id, title, status, date, preview, reply count from card HTML
5. With `--detailed`: fetches each `/c/{id}` page for full body, votes, device info, author
6. Saves unified-format array to `telegram/issues-raw.json`

The `SKILL_DIR` is `.Codex/skills/tweb-bugs` (relative to the repo root).

### Step 3: Analyze & Score

Load issues from all requested platforms' `issues-raw.json` files. Merge into one array.

For each issue, compute these scores (1-10 scale):

#### Scoring Criteria

| Criterion | Weight | How to Score |
|-----------|--------|-------------|
| **Severity** | 3x | Data loss/crash=10, broken core feature=8, cosmetic=2 |
| **Reproduction Probability** | 2x | Always reproducible=10, intermittent=5, cannot reproduce=1 |
| **User Impact Breadth** | 2x | Affects all users=10, specific platform=5, niche browser=2 |
| **Community Signal** | 1.5x | Reactions + comments normalized. Many reactions = high demand |
| **Age Penalty** | 1x | Older bugs get slight boost (long-standing = annoying) |
| **Regression Risk** | 1.5x | "Was working before" / "regression" keywords = higher priority |
| **Data Loss Risk** | 2x | Messages lost, media corrupted, settings wiped = critical |
| **Clear Repro Steps** | 1x | Issue has steps to reproduce = easier to fix = slight boost |

#### Browser/Platform Modifiers
- Chrome/Firefox/Safari/Edge (mainstream) = no modifier
- Opera/Vivaldi/Brave = -1 to breadth
- IE/obscure mobile browsers = -3 to breadth
- Mobile-only = slight reduction unless large mobile userbase
- Electron/desktop app specific = neutral

#### Deduplication

- Group issues by similarity (same root cause, same feature area) — **cross-platform too!**
- A bug reported on both GitHub and bugs.telegram.org likely has the same root cause
- Mark duplicates, keep the one with most detail/reactions as primary
- Link duplicates in the report, noting which platforms they appear on

#### Final Score Formula
```
final = (severity * 3 + repro_prob * 2 + breadth * 2 + community * 1.5 + age * 1 + regression * 1.5 + data_loss * 2 + clear_repro * 1) / 14
```

Normalize to 1-10 scale.

Create `report.md` with:

```markdown
# tweb Bug Triage Report
Generated: {date} | GitHub: {N} issues | Telegram: {M} issues | Duplicates removed: {D}

## Critical (score >= 8)
| # | Score | Platform | Title | Key Tags | Age |
...

## High (score 6-7.9)
...

## Medium (score 4-5.9)
...

## Low (score < 4)
...

## Cross-Platform Duplicates
- GitHub #X ↔ Telegram #Y — same root cause: {description}
...

## Duplicate Groups
- Issues #X, #Y, #Z — same root cause: {description}
...

## By Code Area
### {area name}
- [#{bug_number}] Score {score} — {title}
- [#{bug_number}] Score {score} — {title}
  → Key files: {source files from the dedup step}
...
```

### Step 4: Output

- Save `issues-scored.json` to each platform's cache dir and `report.md` to the cache root
- Display the report to the user (or top N if `--top` was passed)
- Mention how many were fetched per platform, how many dupes found, cache status

## Important Notes

- Issues labeled `enhancement` or `feature` are NOT bugs — exclude them unless they describe broken behavior
- Pull requests appear in the GitHub issues API — filter them out (`pull_request` field is null for real issues)
- On bugs.telegram.org, many issues are marked "Fixed" — filter by `--status open` to focus on unfixed bugs
- Use the issue body + title + labels to infer severity; many issues won't have explicit labels
- When in doubt about a score, be conservative (score lower)
- The LLM analysis step should process issues in batches to stay within context limits
- The Telegram scraper respects rate limits (300ms between requests) — a full scrape with `--detailed` takes several minutes for large datasets
- The `--detailed` flag is recommended for accurate scoring since list-page previews are truncated
