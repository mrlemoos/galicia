<p align="center"><img src="assets/galicia.png" width="256" alt="Galicia glass icon with a gold chalice, pearl host and seven white crosses." /></p>
<h1 align="center">Galicia</h1>

**Spend less context. Keep engineering judgement.**

Agents reread whole docs, repeat checks and ask questions the repo already answers. You pay in tokens, waiting and attention.

Galicia gives coding agents five concise skills and a map to the context each task needs. Resolve decisions, write specs, split work and find root causes. Keep agreed answers and decisions in your repo, ready for the next session.

Spend effort where it earns trust. Preserve evidence, exact contracts and uncertainty. Everything stays project-local, in files you can read and edit. [Read the philosophy](docs/philosophy.md).

| Skill | Job |
|---|---|
| `terse` | Compress communication; ultra requests concise work without promising hidden reasoning savings. |
| `rubberduck` | Resolve design decisions. Pick one-question or independent-batch cadence at setup. |
| `spec` | Write local change specification; recommend `breakdown` for larger work. |
| `breakdown` | Produce approved vertical tickets with explicit blockers. |
| `find-rc` | Reproduce symptom, minimise, test hypotheses, fix root cause, verify regression. |

## Install

Homebrew, macOS or Linux:

```sh
brew tap mrlemoos/galicia https://github.com/mrlemoos/galicia
brew install mrlemoos/galicia/galicia
cd /path/to/project
galicia init
```

Homebrew installs the CLI and Node. Skills, context and hooks stay in the chosen project. The explicit tap URL uses this repository; no separate tap repository required. Homebrew may ask you to trust the formula. Available after the first tagged release publishes `Formula/galicia.rb`. [Release and local validation guide](docs/homebrew.md).

`galicia --version` prints the installed version. `galicia init` and `galicia check` check the latest public stable GitHub release. Any different version prints a reminder and command:

```sh
brew update && brew upgrade mrlemoos/galicia/galicia
```

Lookup capped at 1.5 seconds, runs alongside setup, writes no cache. Offline, rate-limited or invalid responses stay silent. Help/version make no request. Set `GALICIA_NO_UPDATE_CHECK=1` to disable the lookup. No telemetry or project contents sent. Upgrading the CLI leaves existing projects unchanged; rerun `galicia init` in each project to review updates. Customised generated files still require conflict resolution.

Without Homebrew, run the pinned bootstrap from your project's root. Requires **Node 22.18+**, curl and tar.

```sh
curl -fsSL https://raw.githubusercontent.com/mrlemoos/galicia/main/scripts/setup.ts | node --input-type=module
```

Setup downloads pinned source, opens interactive choices, previews project changes, then removes temporary files. No clone, npm install or global installation. Command executes remote code. Bootstrap follows `main`; downloaded installer pins commit `050d4835a5e0032230f6a358567771ea3ec4e73d`.

From an existing checkout, use `node src/cli.ts init --project /absolute/path/to/project`. Runtime has no dependencies or build step. Git required only for Codex startup hooks and the optional Git downloader.

Arrow keys move, space selects, enter continues. Setup chooses agents, skills, grilling cadence and optional hooks, then previews files. `NO_COLOR=1` uses plain numbered prompts. Existing context stays authoritative. Edited generated files cause a conflict; installer writes nothing until conflicts resolved. Repeat identical setup makes no changes.

```sh
galicia init --project /absolute/path/to/project --agents codex,claude,cursor,grok --cadence ask --hooks --dry-run
galicia init --project /absolute/path/to/project --agents codex --cadence one --yes
```

`--dry-run` shows before/after contents. `--yes` accepts the displayed plan. Hooks are opt-in. Skills/context remain project-local. No telemetry or model calls. Different target selections add/update selected files; they do not delete previously installed skills or hooks. Review removal manually.

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
pnpm install --frozen-lockfile
pnpm run check
pnpm test
pnpm run measure
```

Development dependencies provide TypeScript checking and `cl100k_base` / `o200k_base` token measurements. Runtime remains dependency-free. Compare installed originals using `node scripts/measure.ts --help`. [Fixed behaviour scenarios](eval/README.md) distinguish static safeguards from cross-model behaviour, which needs recorded runs. Fewer words alone prove neither token savings nor equal quality.

Native distribution: [scriptc coverage and native validation](docs/scriptc-coverage.md). Node remains required.

Research: [tool-output filtering, context pruning and proxies](docs/research.md). Attribution: [NOTICE.md](NOTICE.md).

## Workspace development

Requires Node 22.23.4+ and pnpm 12.10.1. Root package contains the installer, checker and skills. `website/` contains the Astro marketing site.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check:website
pnpm build
```

`pnpm dev` serves the website at http://localhost:4321. `pnpm build` writes static output to `website/dist/`. See [website guide](website/README.md).
