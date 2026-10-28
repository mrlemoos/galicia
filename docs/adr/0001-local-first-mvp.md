# 0001. Local-first resource management

Status: accepted

## Context

Galicia needs concise reusable engineering workflows across Codex, Claude Code, Cursor and Grok. User approved MVP during design interview. Model behaviour and platform integrations vary; instruction compression alone cannot establish total savings.

## Decision

Keep five independent caveman-style skills. Use project-local files only. Persist specs/tickets as Markdown. Root context map routes to authoritative domain definitions and ADRs. Installer previews changes, preserves user edits and merges supported project hook schemas. Startup checker flags lifecycle evidence, never deletes.

Recommend scoped small-model research/review for consequential ADRs; spawn only when authorised. No automatic delegation or effort change.

## Alternatives

Global installation introduces cross-project state. External trackers require service configuration. Mandatory proxies increase operational coupling. Opaque compressed data reduces inspectability without inherent token benefit. Defer these alternatives.

## Consequences

No remote publishing, global writes or hidden reasoning savings promise. Grok uses pasteable prompts. GitHub download needs explicit trusted source and pinned commit. Cross-model behaviour and live agent hook delivery require later recorded validation. Local automated checks cover deterministic installer/checker behaviour.

## Evidence

[Fixed scenarios](../../eval/README.md), [instruction counts](../measurements.md), [platform sources](../platforms.md), [proxy research](../research.md).
