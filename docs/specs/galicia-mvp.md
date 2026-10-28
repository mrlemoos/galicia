# Galicia MVP

Status: complete
Domain: engineering resource management

## Problem

Verbose skill instructions and broad context loading spend tokens and attention without reliably improving engineering results. Users need inspectable workflows across agent products without external infrastructure.

## Intended behaviour

Five independent caveman-style skills: terse, rubberduck, spec, breakdown, find-rc. No emojis. Resource policy preserves clarity, authorisation, error handling and verification. Root context maps domains; glossary owns business definitions; ADRs preserve durable decisions. Specs/tickets remain local Markdown.

Project-local TypeScript setup selects targets, skills, grilling cadence and optional startup review. Preview precedes writes. Existing context, user edits and unrelated hooks preserved. Download uses explicit trusted repository and immutable commit. Blue, sea-green and warm-white identity uses simplified Galicia coat of arms.

## Acceptance checks

- [x] Five independent caveman-style skills with workflow safeguards.
- [x] Interactive keyboard setup and plain-output fallback; dry-run contents preview.
- [x] Repeat installation unchanged; edited files conflict before writes.
- [x] Hook JSON preserves unrelated configuration; no global installation.
- [x] Read-only bounded spec checker; no age-based or automatic deletion.
- [x] Domain context, glossary, spec and ADR templates documented.
- [x] Pinned download script; invalid source/ref rejected before fetching.
- [x] Editable coat-of-arms SVG visually inspected.
- [x] Fixed behaviour scenarios and instruction-token measurements supplied.

## Validation

`npm run check`, `npm test`, measurement script; terminal keyboard inspection and rendered SVG inspection. Runtime hooks exercised as standalone subprocesses with documented output shapes. Model comparison scenarios supplied for later runs; cross-provider behavioural equivalence is not an MVP claim.

## Decisions

[Local-first MVP](../adr/0001-local-first-mvp.md). [Context ownership](../context-layout.md). [Platform schemas](../platforms.md). [Token measurement limits](../measurements.md).

## Exclusions

Publishing, global agent changes, proxies, automatic effort selection, external trackers, automatic deletion, guaranteed hidden-reasoning savings. No remote release exists yet. Live agent hook delivery, real GitHub download and cross-model quality remain integration validation work.
