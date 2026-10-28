# Token reduction research

Read primary project documentation on 28 October 2026. Claims below describe mechanisms, not independently reproduced savings. No external tools installed.

| Project | Mechanism | Adopt / defer |
|---|---|---|
| [RTK](https://github.com/rtk-ai/rtk) | Command-aware filtering before tool output enters context. | Adopt principle: retain failures, remove progress noise, recover raw output. Integration later; estimated command savings differ from full-session savings. |
| [Tamp](https://github.com/sliday/tamp) | API proxy with structural and lossy tool-result compression stages. | Keep structural cleanup separate from semantic rewriting. Defer deployment; proxy requires client routing compatibility and failure fallback. |
| [DCP](https://github.com/Tarquinen/opencode-dynamic-context-pruning) | Selected stale conversation regions become summaries; README points new work to Sleev. | Retain decisions and original evidence. Defer runtime pruning; deleted constraints can change behaviour. |
| [LLMLingua](https://github.com/microsoft/LLMLingua/blob/main/Transparency_FAQ.md) | Small-model token selection. FAQ flags high compression and short prompts as limitations. | Defer for skill instructions. Already-short directives are sensitive to lost conditions/negations. |
| [LiteLLM](https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/caching_controls.md) | Cached responses avoid repeated upstream calls. | Separate response reuse from context reduction. Fresh tool state and invalidation remain necessary. |

MVP applies the cheap, inspectable layer: smaller skills, selective context, compact evidence, reusable findings. Proxy benchmark later must record baseline quality, full-session input/output/reasoning tokens, cache usage, latency, retries and failures. Transport gzip and `.data` extensions do not shrink the model's decoded token sequence by themselves.
