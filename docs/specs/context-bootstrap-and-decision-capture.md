# Context bootstrap and decision capture

Status: active
Domain: Project context and engineering workflows
Owner: Leo
Related ADRs: [Local-first resource management](../adr/0001-local-first-mvp.md)
Tickets: None. Keep this coherent change in one spec.

## Problem

Galicia scaffolds navigation and record templates. Existing projects still need a deliberate pass to populate useful context from documentation, code and Git history. Current guidance points agents to ADRs but does not explicitly require capturing settled rationale during work.

Decisions can remain in chat, forcing later sessions to reconstruct intent. Copying implementation details into permanent documentation creates another maintenance burden.

## Intended behaviour

### Bootstrap existing context

Offer an explicit, project-local bootstrap workflow. Read existing instructions and the context map first. Inspect relevant documentation, code and bounded Git history to identify purpose, ownership, constraints and recorded decisions.

Reuse authoritative files. Add navigation where useful; do not create a second knowledge directory. Preserve unrelated text and established domain boundaries. Repeating bootstrap against unchanged evidence must not create duplicate records or churn existing prose.

Record sources for proposed conclusions. Code proves current behaviour, not why someone chose it. A commit message or document may support rationale; inferred intent stays labelled as uncertain. Missing history or conflicting sources must produce an explicit gap, not invented agreement. Near-empty projects receive a list of missing context rather than fabricated content.

### Capture settled decisions

During normal work, capture durable rationale when a consequential decision settles. Use existing ADR conventions and link relevant specs. Capture the decision, alternatives, reason and supporting evidence. Skip implementation facts readily recoverable from code, temporary progress and unresolved choices presented as settled facts.

Follow existing authorisation rules. Recommend scoped small-model research/review before consequential ADR work; spawn only when authorised. This workflow grants no new delegation permission.

### Preserve current understanding and history

Keep context maps brief and point to the current authoritative record. Accepted ADRs remain historical records. When a decision changes, create a successor ADR and link both directions, following the existing template. Preserve dated evidence and explain the reversal. Do not rewrite an accepted ADR's original rationale into a different decision.

## Acceptance checks

- [ ] Existing project with scattered documentation receives a concise context map linking authoritative sources, without duplicating their contents.
- [ ] Bootstrap preserves existing instructions, unrelated text and domain ownership; repeated runs against unchanged evidence add no duplicate records.
- [ ] Proposed rationale cites inspected sources. Code-only evidence is not presented as proof of historical intent.
- [ ] Missing Git history, sparse projects and contradictory sources remain explicit gaps or unresolved decisions.
- [ ] Settled consequential choice produces an ADR with alternatives, rationale and evidence, linked from relevant context/specs.
- [ ] Routine implementation change without a durable decision produces no ADR.
- [ ] Unresolved choice produces no accepted ADR. Research/review recommendation does not trigger unauthorised agents.
- [ ] Reversal preserves the accepted predecessor, creates a successor and links both directions.
- [ ] Fresh-session navigation reaches the current decision without loading every historical record.
- [ ] Installed instructions and templates carry the agreed workflow across supported agent targets while preserving user-owned context.
- [ ] Documentation distinguishes deterministic checks from observed agent behaviour; no unmeasured savings claims.

## Decisions and contracts

- Existing `context.md`, domain context, `docs/Language.md`, ADRs and specs retain their roles. No additional memory tree or external service.
- Bootstrap is explicit. Ordinary installation does not silently infer and populate project history.
- Use existing Markdown templates. Keep skill prose concise and use British spelling.
- Markdown remains directly editable. Existing validation remains necessary; a prescribed writer cannot guarantee all edits use it.
- Source inspiration: [brain.md](https://github.com/mindmuxai/brain.md), particularly selective durable capture and separation of current understanding from evidence. Its mandatory CLI writer and separate storage layout are outside this change.
- Existing [context ownership](../context-layout.md) and [ADR template](../../templates/adr.md) govern navigation and supersession.

## Test seam

User confirmed on 2026-11-16: extend existing [agent behaviour scenarios](../../eval/scenarios.json) for bootstrap, selective capture and reversal. Observe resulting files and source references in fresh fixture projects. This seam exercises agent judgement, which static string assertions cannot prove.

Use existing [installer tests](../../tests/install.test.ts) for instruction/template distribution, preservation and rerun behaviour. Add deterministic tests only for executable changes or distribution contracts. Follow the existing [evaluation protocol](../../eval/README.md); record model/client, scenario, visible tool evidence and pass/fail. Unrun clients remain unverified.

## Validation

```sh
pnpm run check
pnpm test
pnpm run measure
node .galicia/check.ts
git diff --check
```

Requires Node >=22.18 and installed development dependencies. Measurement reports named-encoding instruction counts only. For this spec-only draft, inspect links, paths and command examples and run metadata and whitespace checks.

Before completion, satisfy acceptance checks, record relevant scenario observations and deterministic results, and state any unverified agent targets. Static checks alone cannot complete behavioural acceptance.

### Implementation evidence, 2026-11-16

Shared workflow installs as `.galicia/context-workflow.md`; generated agent guidance discovers it on explicit bootstrap requests and settled consequential choices. Rubberduck/spec reinforce capture. ADR template documents supersession fields. Existing context ownership documents invocation and the shared workflow location.

`pnpm run check`, `pnpm test`, `pnpm run measure`, `node .galicia/check.ts` and `git diff --check` passed. Full test run: 31 passed, one optional native parity test skipped. Installer coverage checks exact workflow distribution, user-edit conflict protection, no inferred ADR during setup and existing rerun preservation. Release coverage checks distribution from a relocated archive.

Five context scenarios added in `eval/scenarios.json`. Agent observations remain unrun for Codex, Claude, Cursor and Grok; behavioural acceptance remains open and status stays active. Measurement excludes shared workflow/guidance overhead and proves no runtime savings.

## Exclusions

- New memory directory, database, external tracker or mandatory CLI for Markdown reads/writes.
- Automatic historical inference during `init`.
- Bulk loading every linked context file or recording every implementation change.
- New startup snapshots, lifecycle hook integration or changed context limits.
- Automatic delegation, paid evaluation, release, publication or deletion of records.

## Unresolved decisions

- Behavioural evaluation seam confirmed by Leo on 2026-11-16.
- Invocation resolved: explicit agent request using installed `.galicia/context-workflow.md`. Shared agent guidance handles capture; rubberduck/spec reinforce it. No new skill or CLI command.
- No new ADR required for this draft: scope follows the existing local-first decision and ADR supersession contract. Revisit if implementation introduces a consequential tradeoff beyond those boundaries.
