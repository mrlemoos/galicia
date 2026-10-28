<p align="center"><img src="assets/galicia.png" width="256" alt="Galicia glass icon with a gold chalice, pearl host and seven white crosses." /></p>
<h1 align="center">Galicia</h1>

Galicia is an engineering philosophy and five agent skills. Spend context, tokens, tools and human attention where they improve outcomes. Keep evidence, clarity and correctness.

Skills use caveman prose. No emojis, filler or repeated instructions. Exact contracts, uncertainty and failure handling stay explicit. [Read the philosophy](docs/philosophy.md).

| Skill | Job |
|---|---|
| `terse` | Compress communication; ultra requests concise work without promising hidden reasoning savings. |
| `rubberduck` | Resolve design decisions. Pick one-question or independent-batch cadence at setup. |
| `spec` | Write local change specification; recommend `breakdown` for larger work. |
| `breakdown` | Produce approved vertical tickets with explicit blockers. |
| `find-rc` | Reproduce symptom, minimise, test hypotheses, fix root cause, verify regression. |

## Install

Run from your project's root in a macOS or Linux terminal. Requires **Node 22.18+**, curl and tar.

```sh
curl -fsSL https://raw.githubusercontent.com/mrlemoos/galicia/main/scripts/setup.ts | node --input-type=module
```

Setup downloads pinned source, opens interactive choices, previews project changes, then removes temporary files. No clone, npm install or global installation. Command executes remote code. Bootstrap follows `main`; downloaded installer pins commit `050d4835a5e0032230f6a358567771ea3ec4e73d`.

From an existing checkout, use `node src/cli.ts init --project /absolute/path/to/project`. Runtime has no dependencies or build step. Git required only for Codex startup hooks and the optional Git downloader.

Arrow keys move, space selects, enter continues. Setup chooses agents, skills, grilling cadence and optional hooks, then previews files. `NO_COLOR=1` uses plain numbered prompts. Existing context stays authoritative. Edited generated files cause a conflict; installer writes nothing until conflicts resolved. Repeat identical setup makes no changes.

```sh
node src/cli.ts init --project /absolute/path/to/project --agents codex,claude,cursor,grok --cadence ask --hooks --dry-run
node src/cli.ts init --project /absolute/path/to/project --agents codex --cadence one --yes
```

`--dry-run` shows before/after contents. `--yes` accepts the displayed plan. Hooks are opt-in. All installs project-local, never home/global. No telemetry or model calls. Different target selections add/update selected files; they do not delete previously installed skills or hooks. Review removal manually.

## Choose an exact revision

For a reviewed bootstrap, replace `main` in the install URL with its full commit SHA. Bootstrap still downloads its embedded installer revision.

Existing checkouts also support the Git downloader:

```sh
node scripts/download.ts --repo mrlemoos/galicia --ref 050d4835a5e0032230f6a358567771ea3ec4e73d --project /absolute/path/to/project
```

Requires Git/network. Fetches exact commit into temporary directory, verifies SHA, runs interactive setup, removes download. Branches and tags rejected.

## Context that scales

`AGENTS.md` points to root `context.md`. That map links business domains, their local context, glossary and ADRs. Load only task-relevant links. Small projects keep context at root; large Nx/Bazel repos distribute by business ownership, with technical packages linking to owning domains. `.data` saves no tokens by itself.

Initialiser creates templates only where absent:

```text
context.md
docs/Language.md
docs/adr/README.md
docs/specs/README.md
.galicia/config.json
```

One authoritative definition per domain term. Glossary excludes framework/library terminology. Specs describe changes; ADRs retain durable decisions. [Context conventions](docs/context-layout.md).

## Agent support

| Target | Skills | Startup review |
|---|---|---|
| Codex | `.agents/skills/<name>/SKILL.md` | `.codex/hooks.json`, reviewed/trusted in agent. |
| Claude Code | `.claude/skills/<name>/SKILL.md` | SessionStart merged into `.claude/settings.json`. |
| Cursor | Shared `.agents/skills/` or Claude compatibility directory | sessionStart merged into `.cursor/hooks.json`. |
| Grok web/app | Pasteable `.galicia/prompts/<name>.md` | Manual review; no native filesystem integration assumed. |

Schemas checked against official docs; actual startup delivery requires testing in installed agent/version. Cursor can discover both compatibility directories when Codex and Claude are selected; same-named skills contain identical text. Existing unrelated hooks/config preserved. Restart agents after setup. Disable conflicting original skill versions to avoid overlapping triggers.

Manual fallback, available for every target:

```sh
node .galicia/check.ts
```

Checker reads bounded `specs/` trees, flags explicit supersession, abandonment and inconsistent completion. Never deletes. Age ignored. Semantic disagreement with implementation needs agent review. Limits: 1,500 directories, 300 Markdown files, 64 KiB/file, eight startup findings. Skipped work reported. [Integration sources](docs/platforms.md).

## Validation

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run measure
```

Development dependencies provide TypeScript checking and `cl100k_base` / `o200k_base` token measurements. Runtime remains dependency-free. Compare installed originals using `node scripts/measure.ts --help`. [Fixed behaviour scenarios](eval/README.md) distinguish static safeguards from cross-model behaviour, which needs recorded runs. Fewer words alone prove neither token savings nor equal quality.

Native distribution: [scriptc coverage and native validation](docs/scriptc-coverage.md). Node remains required.

Research: [tool-output filtering, context pruning and proxies](docs/research.md). Attribution: [NOTICE.md](NOTICE.md).
