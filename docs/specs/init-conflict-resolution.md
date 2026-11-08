# Init conflict resolution

Status: complete
Domain: engineering resource management
Owner: Leo
Related ADRs: [0001 Local-first resource management](../adr/0001-local-first-mvp.md)
Tickets: none
Resolution ADR: [0002 Owned edit resolution](../adr/0002-owned-edit-resolution.md)

## Problem

`galicia init` treats an existing file as a conflict whenever its bytes differ from the copy this run would write and `.galicia/manifest.json` does not record those bytes. One such path aborts the whole plan. The terminal lists paths, then exits 1 with "Conflicting files listed. Nothing written. Review existing files before retrying." `--dry-run` prints the same failure. Nothing in the message says how to finish setup.

That blocks two different situations. A project file Galicia has never recorded is stuck behind the same abort as a file Galicia wrote and the user later edited. A cadence change, a new skill, or a hook merge in that run is discarded with the conflict.

## Intended behaviour

Init previews the plan, resolves every conflict, then writes once. A cancel at the conflict prompt or at the apply prompt writes nothing.

A path is a conflict only when the manifest has a hash for it and this run's copy differs from the file, in either of these cases:

- The file bytes differ from the recorded hash. Galicia wrote the file, and the file has changed since that write.
- The recorded hash matches the file, and the manifest has a declined hash for that path which differs from this run's copy. The user kept their bytes earlier, and Galicia's copy has changed.

Every other existing path with different bytes is an `update`. A missing manifest means there are no recorded hashes, so existing files update. An absent path is a `create`. Bytes that already match this run's copy are `same`.

`context.md`, `docs/Language.md`, `docs/adr/README.md`, and `docs/specs/README.md` stay byte for byte once they exist. This run's copy for those paths is the file already on disk, so they are `same`. Hook JSON still merges, and unrelated hook fields stay. `AGENTS.md` and `CLAUDE.md` keep the text outside the Galicia markers. A start marker with no end aborts before any write.

For a conflict, init prints that file's before and after, then asks `keep` or `take`. The default is `keep`. Files are prompted in preview order. The two answers can differ per file.

`keep` leaves the file untouched. The sealed manifest records the sha256 of the current bytes in `files`, and the sha256 of the refused copy in `declined`. The next init is quiet while the file and Galicia's copy both stay the same. That quiet run still stores the declined hash, including when the kept file is not part of the write and when other paths do change. Editing the kept file makes it a conflict again. A later Galicia copy makes it a conflict again.

`take` writes Galicia's copy. The sealed manifest records that copy's hash and drops `declined` for the path.

`--on-conflict=keep` and `--on-conflict=take` apply one answer to every conflict. The flag is ignored when the plan has no conflict. `--yes` accepts the apply prompt and does not choose `take`. A non-interactive run with a conflict and no flag writes nothing, exits 1, names each conflicted path, and mentions `--on-conflict`. Stderr still contains `Conflicting files`. An unrecognised flag value aborts before any write, as other invalid flags do. `--dry-run` prints conflicts with before and after, writes nothing, and exits 0.

The apply confirmation still gates the write unless `--yes` is set. Non-interactive apply still needs `--yes`. `applyPlan` rejects a plan that still contains `conflict`. A file that changes after the preview aborts the write and rolls back files written in that apply. Symlinks and invalid hook JSON still abort before writes.

The manifest stays version 1. Old manifests have no `declined` field. Absence means no refusals. `declined` is omitted when empty, so a project that never keeps a file still gets a byte-identical manifest on a repeat run. `files` and `declined` are objects of path to sha256 string, using the hash the installer already uses. If `declined` is present and is not that kind of object, init aborts before writes. The manifest file is absent from its own `files` map.

```json
{
  "version": 1,
  "files": {
    ".agents/skills/terse/SKILL.md": "<sha256 of the bytes init will treat as owned>"
  },
  "declined": {
    ".agents/skills/terse/SKILL.md": "<sha256 of the Galicia copy the user refused>"
  }
}
```

Sealing turns each `conflict` into `keep` or `update` before `applyPlan`. `keep` is not written. `update` and `create` are written. The manifest entry that gets written is the sealed one. A repeat init with the same selections, the same Galicia copies, and no further edits reports that the project is already initialised.

## Acceptance checks

- [x] An owned skill whose bytes changed is `conflict`. `applyPlan` on that plan throws, and the skill and unrelated files stay as they were.
- [x] Non-interactive `galicia init --yes` with that conflict exits 1, writes nothing, names the path, mentions `--on-conflict`, and stderr matches `Conflicting files`.
- [x] `--on-conflict=keep --yes` with a cadence change leaves the edited skill in place, writes the new cadence, and records both the skill hash and the declined Galicia hash.
- [x] The next init with the same skill copy exits 0, leaves the skill in place, and the manifest still has that declined hash.
- [x] A further Galicia change to that kept skill is `conflict` again. Without a resolution, nothing is written.
- [x] `--on-conflict=take --yes` replaces the skill with Galicia's copy and the manifest has no `declined` entry for it.
- [x] A skill that already exists, with no manifest hash, is `update`. Apply replaces it with Galicia's copy.
- [x] A missing manifest plus an edited generated file is an `update`. Apply writes Galicia's copy.
- [x] Existing `context.md` text stays after init. Text outside the `AGENTS.md` markers stays. An unowned edited Galicia block is replaced. An owned edited block conflicts.
- [x] `--dry-run` with a conflict exits 0, shows that path's before and after, and creates no files.
- [x] `--on-conflict=keep` with no conflicts behaves as init without the flag. An invalid `--on-conflict` value exits 1 and writes nothing.
- [x] A file edited after the preview still aborts the apply and leaves earlier files in that apply unchanged.
- [x] `--help`, `README.md`, and `docs/homebrew.md` describe unowned update, `keep`, `take`, and `--on-conflict`.
- [x] `docs/adr/0002-owned-edit-resolution.md` records the tradeoff and links this spec. This spec links that ADR once the file exists. `docs/specs/galicia-mvp.md` stays as the completed MVP record.

## Decisions and contracts

Owned edits are kept or taken. Unowned files are updated. The plan stays atomic. Those are the decisions from the init interview.

`src/cli.ts` owns flags, preview, prompts, and the dry-run exit. `src/install.ts` owns classification, sealing, the manifest, and `applyPlan`. The planner may build a provisional manifest, and that provisional manifest is not a writable plan while any change is still `conflict`.

`0001` still stands for local files, preview, and preservation of user edits. This change narrows preservation to hashes Galicia has recorded, plus the context files and the text outside guidance markers. Implementation adds `docs/adr/0002-owned-edit-resolution.md` for that narrower rule. A scoped small-model review of the ADR was recommended. The user declined that review. Do not spawn one for this change.

One spec. Installer, CLI, tests, the three docs, and the ADR ship together.

## Test seam

`tests/install.test.ts` already drives `planInstall` and `applyPlan` in a temporary project, and spawns `node src/cli.ts` for dry-run and bad flags. Extend that file. Pass `keep` or `take` into the seal step so the tests do not need a terminal. CLI coverage is the non-interactive flag, `--yes`, and `--dry-run`. Interactive `keep` / `take` uses the existing `choose` helper. No new test runner.

Prior art in that file covers the abort of an edited skill, guidance edits outside the markers, the post-preview race, hook merging, and dry-run. The owned-edit abort stays. The new cases are unowned update, seal, declined-hash carry-forward, and the flag.

## Validation

```sh
pnpm run check
pnpm test
```

`Status: complete` waits on those commands passing and on the acceptance checks above. Age is not evidence. The native binary under `.scratch/` is not rebuilt for this change. `tests/native.test.ts` still looks for `Conflicting files` when `GALICIA_NATIVE_CLI` is set.

## Exclusions

- Line-level merge of a user edit with a Galicia copy.
- Refreshing an existing `context.md`, `docs/Language.md`, `docs/adr/README.md`, or `docs/specs/README.md` from the template.
- Changing hook merge, symlink refusal, or the post-preview rollback.
- Making `--yes` mean `take`.
- Rebuilding the native CLI.
- Rewriting the completed MVP checklist.
- A research subagent for the ADR.

## Unresolved decisions

None.

## Implementation validation

`pnpm run check` and `pnpm test` pass. Setup displays the target project, explains cadence and hook choices, omits unchanged paths, and summarises writes and kept files before confirmation. Conflict recovery output supplies explicit retry flags. Native binary remains unbuilt; native parity test remains optional.
