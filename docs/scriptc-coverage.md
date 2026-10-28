# Native compiler compatibility

Checked 28 October 2026. scriptc 0.4.5. macOS ARM64. Node 25.9.0. Source commit `1dd4bb4ed74ca824626ec0e10c6022ecd67620d7`.

| Entry | Static statements | Reported static coverage | Failed statements | Result |
|---|---:|---:|---:|---|
| `src/cli.ts` | 241 / 246 | 97% | 5 | Blocked |
| `src/startup.ts` | 25 / 26 | 96% | 1 | Blocked |
| `scripts/setup.ts` | 34 / 36 | 94% | 2 | Blocked |

Coverage measures compiler support. No native build or runtime parity demonstrated. Dynamic counts can overlap compiler categories; do not add them to static counts. [Recorded diagnostics](scriptc-coverage.json) preserve compiler output with repository-relative paths.

## Repeat

Compiler installation via npm requires Node >=24. End users would not need Node for a validated native release.

```sh
npx --yes scriptc@0.4.5 coverage src/cli.ts --fail-on blockers --print diagnostics
npx --yes scriptc@0.4.5 coverage src/startup.ts --fail-on blockers --print diagnostics
npx --yes scriptc@0.4.5 coverage scripts/setup.ts --fail-on blockers --print diagnostics
```

Initial checks omitted `--fail-on blockers`. Compiler exited zero despite `success: false` and error diagnostics. Use explicit failure policy in automation.

## Blockers

- `src/check-specs.ts:17`, `src/install.ts:82`, `src/terminal.ts:42`: SC1090. Function values with optional/defaulted parameters lack supported completed signatures.
- `src/terminal.ts:67`: SC2020. Keypress callback must accept `string | undefined`; escape sequences can omit text.
- `src/install.ts:147`: SC2020. `fs.promises.writeFile` with `flag` unsupported. Current exclusive creation protects existing files. Preserve this guarantee in any rewrite.
- `scripts/setup.ts:26`: SC1090. Binary `Uint8Array` passed to `writeFile` rejected by compiler.
- `scripts/setup.ts:30`: SC2020. Numeric terminal descriptor in `spawnSync` stdio tuple unsupported.

## Distribution work still needed

Native CLI needs packaged skill/template assets instead of assuming source files beside `import.meta.url`. Installed checker and hooks currently invoke Node; compiling setup alone does not remove that dependency. Bootstrap also starts TypeScript through `process.execPath`; native distribution needs a different launch path.

Recommendation: keep working Node installer. Prototype compatibility changes separately. Preserve exclusive writes, rollback, conflict detection and terminal cancellation. Validate native build and behaviour before publishing platform binaries or replacing install command.
