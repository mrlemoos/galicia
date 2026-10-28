# Platform integration

Checked against official documentation on 28 October 2026. Schemas can change; local tests validate generated config, not agent delivery.

| Target | Reference | Galicia adapter |
|---|---|---|
| Codex | [Skills](https://developers.openai.com/codex/skills), [hooks](https://developers.openai.com/codex/hooks) | Project `.agents/skills`; SessionStart command in `.codex/hooks.json`, `hookSpecificOutput.additionalContext`. Trust hooks through agent UI. Git-root resolution handles launch from nested directory. |
| Claude Code | [Hooks reference](https://code.claude.com/docs/en/hooks) | Project `.claude/skills`; SessionStart in settings, project-root env resolves command, JSON additionalContext. |
| Cursor | [Skills](https://cursor.com/docs/skills), [hooks](https://cursor.com/docs/hooks) | Shared skills directory; project sessionStart command, JSON additional_context. Hook context delivery asynchronous. |
| Grok | Portable prompt fallback | Paste selected prompt and relevant context. No claim of native skills or hooks. |

Node 22.18+ must be available in agent process PATH. `.galicia/package.json` establishes ESM independently of host project's package type. Generated checker starts at its own project root, does not depend on session cwd.

Installer merges JSON hooks, preserves unrelated fields, rejects invalid JSON/schema and symlink destinations. It does not enable disabled organisation policies, bypass hook trust or change global config. Unsupported/disabled versions use `node .galicia/check.ts` manually; no version is inferred from presence of a config file.

Reasoning reference: [OpenAI reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning). Skill cannot set effort itself; no cross-provider hidden reasoning savings claimed.
