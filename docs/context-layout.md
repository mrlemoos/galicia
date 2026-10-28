# Context ownership

Root `context.md` is a map, not an encyclopaedia. `AGENTS.md` holds working rules and links to it. Follow inherited instructions before loading relevant domain files.

## Small project

```text
AGENTS.md -> context.md
docs/Language.md
docs/adr/0001-payment-settlement.md
docs/specs/shared-expenses.md
docs/specs/shared-expenses/tickets/01-record-expense.md
```

Root context records product purpose, boundaries, interfaces and exact validation commands. No empty domain scaffolding generated. Framework commands belong in context, never domain glossary.

## Large repository

```text
context.md -> domains/billing/context.md
           -> domains/identity/context.md
domains/billing/Language.md
domains/billing/docs/specs/settlement.md
domains/billing/docs/adr/0001-ledger-ownership.md
apps/checkout/context.md -> domains/billing/context.md
packages/ledger/context.md -> domains/billing/context.md
```

Root `docs/Language.md` links authoritative domain glossaries. Shared vocabulary owns one definition. Domain context lists contracts, dependencies, active specs, decisions and test commands. Cross-domain change loads relevant contracts on both sides. Nx projects and Bazel packages are navigation clues, not automatically business domains.

Templates intentionally cover only root navigation. Create domain files once actual ownership is understood; do not generate a directory per package.

## Spec lifecycle

Draft -> active -> complete. Superseded and abandoned are separate outcomes. Complete requires acceptance evidence. Superseded links replacement relative to spec file; ADR links preserve lasting rationale. Keep old ADRs and supersession history.

Startup hook reports candidates; it cannot prove code implements a spec. Agent reviews only relevant candidates against implementation, links evidence and recommends retain, revise, archive or delete. Explicit approval precedes deletion. Old dates alone carry no deletion signal.
