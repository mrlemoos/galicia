# Galicia context

Resource-conscious engineering tools. Five concise instruction skills, local Markdown context and lifecycle conventions, project-local setup, read-only spec review. CLI needs Node, no runtime packages. Homebrew manages CLI and Node; skills/context stay project-local. No external tracker, proxy or model calls.

| Scope | Context |
|---|---|
| Marketing website | `website/`, [website guide](website/README.md) |
| Skill workflows | Root `<skill>/SKILL.md`, [behaviour scenarios](eval/README.md) |
| Installation | `src/cli.ts`, `src/install.ts`, `src/terminal.ts`, `scripts/download.ts`, `scripts/setup.ts` |
| Homebrew and releases | [Distribution guide](docs/homebrew.md), `scripts/release.ts`, `src/version.ts`, `src/update.ts` |
| Spec review | `src/check-specs.ts`, `src/startup.ts` |
| Context ownership | [Layout](docs/context-layout.md), [domain language](docs/Language.md) |
| Resource policy | [Philosophy](docs/philosophy.md), [research](docs/research.md), [measurements](docs/measurements.md) |
| Decisions | [Local-first MVP](docs/adr/0001-local-first-mvp.md) |

Validate with `pnpm run check` and `pnpm test`. Measurement command: `node scripts/measure.ts --help`. Fixed model comparisons remain unrun; do not claim behavioural equivalence or runtime savings from instruction token counts.
