# Repository Guidelines

## Project structure and module organisation

Keep each skill in a descriptive directory, with its instructions in `SKILL.md`. Galicia has five root skill directories, shared `src/` installer/checker code, `templates/` context starters, `scripts/` download/measurement utilities, `tests/` deterministic checks, `eval/` model scenarios and `assets/` branding. Read [context.md](context.md) for navigation. Skill prose uses caveman style, exact conditions, no emojis. Generated experiments belong in ignored `.scratch/`.

Keep generated output and temporary experiments out of committed source. Document any new directory convention when introducing it.

## Build, test and development commands

Galicia requires Node >=22.18. Run `npm ci --ignore-scripts`, `npm run check` for TypeScript, `npm test` for installer/checker behaviour, and `npm run measure` for named-encoding instruction counts. `node src/cli.ts init --project PATH` starts setup; `node scripts/download.ts --help` documents pinned downloads. Runtime needs no install/build. No `build` script exists. Static checks do not prove cross-model behaviour.

When adding executable TypeScript, document its exact invocation and prerequisites in the relevant skill. If package scripts become necessary, define them in `package.json` and explain their purpose here. For Markdown changes, check links, paths and command examples before submitting.

## Coding style and naming conventions

Write code in TypeScript. Use British spelling in documentation and user-facing text. Use two spaces for indentation in new TypeScript files, and follow any formatter configuration introduced later.

Use descriptive kebab-case directory and file names. Preserve recognised instruction filenames such as `SKILL.md` and `AGENTS.md`. Keep instructions direct, with concrete commands and explicit paths.

## Testing guidelines

Use Node's built-in test runner. No coverage threshold established. Add a small test or assert-based self-check for non-trivial executable logic. Cover invalid input and failure handling where relevant. Document how contributors can run each check.

## Commit and pull request guidelines

No historical commit convention is prescribed. Use short, imperative messages such as `Add skill validation instructions`.

Pull requests should explain the change, identify affected skills and report validation performed. Link a related issue when available. Include screenshots only when a visual result needs review.

## Agent-specific instructions

Read the relevant skill before changing it. Use the unslop skill when drafting prose. Treat references to "emails" as Apple Mail unless explicitly stated otherwise. Never commit credentials or private user data.
