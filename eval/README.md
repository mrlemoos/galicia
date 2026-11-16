# Behaviour comparisons

[Fixed scenarios](scenarios.json) define required observations and explicit failure conditions. They are evaluation inputs, not automated proof of model behaviour.

For each target/model, start fresh sessions with original and Galicia skills separately. Keep task context, tool access, model/version and effort identical. Save prompt, visible response, tool evidence, input/output/reasoning/cache usage where exposed, latency and pass/fail per requirement. Never request or record private chain-of-thought. Repeat to check variation. Missing telemetry stays unmeasured.

Use original Matt Pocock 1.3.1 source and supplied Caveman instruction, fingerprinted in [token report](../docs/measurements.md). Cadence-choice and concise user outcomes are intentional changes; judge against agreed Galicia contract as well as source workflow, not byte-for-byte parity.

| Target | Original runs | Galicia runs | Behaviour parity |
|---|---|---|---|
| Codex | Not run | Not run | Unverified |
| Claude | Not run | Not run | Unverified |
| Cursor | Not run | Not run | Unverified |
| Grok | Not run | Not run | Unverified |

No provider credentials or paid model runs required for local build. `npm test` checks installer/checker behaviour, not these model outputs. Treat release as an MVP awaiting cross-model evaluation.

## Context workflow scenarios

`context-workflow` scenarios load installed `AGENTS.md` and `.galicia/context-workflow.md`, not a new skill. Prepare fresh projects with the files/history described in each prompt. Preserve fixture inputs and resulting diffs with observations. For the existing-project case, run bootstrap twice and compare the second diff. Exercise selective capture, unresolved choices, missing evidence and reversal separately. These cases remain unrun across all target clients; installer tests prove delivery and preservation only.

## Intentional differences

- `rubberduck`: setup chooses one question or independent batches; no mandatory exploration subagent.
- `spec`: distinct user outcomes replace mandatory extensive repetitive stories. Paths may navigate context; implementation recipes discouraged. Local Markdown replaces tracker publishing.
- `breakdown`: same vertical/blocking/approval safeguards; local Markdown only, no external implement skill dependency.
- `find-rc`: preserves symptom-specific failing loop, reduction, falsifiable hypotheses, one-variable probes, real-seam regression and cleanup. Reproduction limitations must remain explicit.
- `unit-test`, `behavioural-test`, `e2e-test`: no original source; Galicia-authored. Scenarios judge against Galicia contract only: sphere boundaries, Arrange-Act-Assert, mock scope, no production edits to reach green, run evidence.
- `commit`: no original source; Galicia-authored. Scenarios judge against Galicia contract only: one behaviour per commit, test in the same commit at the lowest fitting sphere, approval before staging, green before the next commit.
- `terse`: chat output shape (answer first, 20-word cap, no routine tool narration, changed lines only, pre-send cut). Host complete-sentence style loses for chat. No measured output or hidden-reasoning savings. Filler and order scenarios check compression against preserved conditions.
