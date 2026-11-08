# Owned edit resolution

Status: accepted

## Context

One edited file previously blocked every install change. Existing files without recorded ownership had no recovery path. Users need to preserve individual edits while applying unrelated setup changes.

## Decision

Classify differing unowned files as updates. For edited files with recorded hashes, preview contents and ask `keep` or `take`, defaulting to `keep`. Store kept file hashes and declined Galicia hashes in the version 1 manifest. Ask again when either copy changes. Resolve all conflicts before confirming a single atomic apply.

Preserve existing context files, guidance outside Galicia markers and unrelated hook fields. Require explicit conflict policy for unattended conflicts. `--yes` only accepts apply. Dry-run never writes.

## Alternatives

Aborting every conflict leaves setup blocked. Replacing all edited files loses custom instructions. Line-level merging adds ambiguity to instruction files and remains outside scope.

## Consequences

Unowned generated files may be replaced. Preview and confirmation expose those updates before writing. Declined hashes add manifest state but prevent repeated prompts for unchanged decisions. Existing manifests remain compatible.

Scoped small-model review was recommended during the interview. The user declined it.

## Linked specs

- [Init conflict resolution](../specs/init-conflict-resolution.md)
- [Local-first MVP](0001-local-first-mvp.md)
