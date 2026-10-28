# Galicia context

Resource-conscious engineering tools. Five concise instruction skills, local Markdown context and lifecycle conventions, project-local installer, read-only spec review. Runtime has no dependencies. No global installation, external tracker, proxy or model calls.

| Scope | Context |
|---|---|
| Skill workflows | Root `<skill>/SKILL.md`, [behaviour scenarios](eval/README.md) |
| Installation | `src/cli.ts`, `src/install.ts`, `src/terminal.ts`, `scripts/download.ts` |
| Spec review | `src/check-specs.ts`, `src/startup.ts` |
| Context ownership | [Layout](docs/context-layout.md), [domain language](docs/Language.md) |
| Resource policy | [Philosophy](docs/philosophy.md), [research](docs/research.md), [measurements](docs/measurements.md) |
| Decisions | [Local-first MVP](docs/adr/0001-local-first-mvp.md) |

Validate with `npm run check` and `npm test`. Measurement command: `node scripts/measure.ts --help`. Fixed model comparisons remain unrun; do not claim behavioural equivalence or runtime savings from instruction token counts.
