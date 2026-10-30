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

## Intentional differences

- `rubberduck`: setup chooses one question or independent batches; no mandatory exploration subagent.
- `spec`: distinct user outcomes replace mandatory extensive repetitive stories. Paths may navigate context; implementation recipes discouraged. Local Markdown replaces tracker publishing.
- `breakdown`: same vertical/blocking/approval safeguards; local Markdown only, no external implement skill dependency.
- `find-rc`: preserves symptom-specific failing loop, reduction, falsifiable hypotheses, one-variable probes, real-seam regression and cleanup. Reproduction limitations must remain explicit.
- `terse`: adds resource guidance and honest hidden-reasoning limits; no percentage savings promise. Filler and order scenarios check sentence compression against preserved conditions.
