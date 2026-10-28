# Native compiler compatibility

Checked 28 October 2026. scriptc 0.4.5. macOS ARM64. Node 25.9.0. Source commit `99d7eb651a5d90e200d52577ab1c69fe5380fef4`.

| Entry | Static statements | Reported static coverage | Failed statements | Native build |
|---|---:|---:|---:|---|
| `src/cli.ts` | 315 / 315 | 100% | 0 | Passed |
| `src/startup.ts` | 75 / 75 | 100% | 0 | Passed |
| `scripts/setup.ts` | 38 / 38 | 100% | 0 | Passed |

All three coverage checks exit zero with `--fail-on blockers`. No diagnostic warnings or errors remain. [Recorded diagnostics](scriptc-coverage.json) use repository-relative paths. Dynamic counts overlap compiler categories; 100% static coverage does not mean every runtime value has a concrete type.

## Repeat

Compiler installation via npm requires Node >=24. Native builds require platform linker and SDK. Current source installer still requires Node >=22.18.

```sh
npx --yes scriptc@0.4.5 coverage src/cli.ts --fail-on blockers --print diagnostics
npx --yes scriptc@0.4.5 coverage src/startup.ts --fail-on blockers --print diagnostics
npx --yes scriptc@0.4.5 coverage scripts/setup.ts --fail-on blockers --print diagnostics
mkdir -p .scratch/native
npx --yes scriptc@0.4.5 build src/cli.ts -o .scratch/native/galicia --no-keep-llvm
npx --yes scriptc@0.4.5 build src/startup.ts -o .scratch/native/startup --no-keep-llvm
npx --yes scriptc@0.4.5 build scripts/setup.ts -o .scratch/native/setup --no-keep-llvm
GALICIA_NATIVE_CLI="$PWD/.scratch/native/galicia" npm test
```

Initial checks omitted `--fail-on blockers`. Compiler exited zero despite `success: false` and error diagnostics. Keep explicit failure policy in automation.

## Resolved findings

- Required internal parameters replace optional/defaulted function values. Callers pass explicit defaults.
- Keypress callback accepts `string | undefined` and Node's full `Key` type.
- Exclusive staging uses `open(path, 'wx')`, handle write and handle close. Cleanup starts only after successful open. A pre-existing staging file stays untouched; earlier writes roll back on collision.
- Binary archive writes use an exclusive file handle and Buffer.
- Interactive bootstrap reopens `/dev/tty` through a fixed shell command with positional arguments. Child-process stdio stays `inherit`; no numeric descriptor tuple.
- Hook entries use explicit `unknown[]`. This fixes a native runtime conversion failure missed by coverage.
- Keypress listeners use `once` and rearm while selection remains active. Native listener removal compiled but crashed during cancellation.
- Readline cleanup pauses input. CLI exits after terminal work completes, avoiding retained native readline handles on Ctrl-C.

## Runtime validation

TypeScript check passed. All 15 tests passed with native CLI enabled. Default `npm test` runs 14 tests and skips native comparison unless `GALICIA_NATIVE_CLI` points to a compiled binary.

Native CLI produced byte-identical installed files to Node across all four agent targets, including hook configuration. Native rerun, conflict rejection, invalid-agent rejection and checker findings passed. Exclusive-collision regression verifies foreign-file preservation and rollback under Node.

Manual native terminal checks covered arrow navigation, transition between selection prompts and Ctrl-C with cursor restoration. Plain numbered-prompt Ctrl-C exited with status 1. Cancellation left target directory empty. Native CLI help/check and startup JSON smoke checks also passed.

## Distribution work still needed

Compiler blockers resolved. These are source-checkout builds, not portable releases. Native CLI still reads skill/template assets from source paths. Native startup resolves source module location; it needs a relocatable project path before distribution. Installed checker/hooks still invoke Node. Bootstrap still launches downloaded TypeScript through `process.execPath`; compiling it does not remove that dependency.

A Node-free release needs packaged assets, native checker/hook installation, platform builds and a binary-download bootstrap. Cross-platform and complete interactive installation tests remain unrun. Public install command remains unchanged until that work passes.
