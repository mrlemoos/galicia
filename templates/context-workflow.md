# Context bootstrap and decision capture

## Bootstrap

Run only when user requests project context bootstrap. Installation scaffolds files; never infer history during setup.

Read inherited instructions, context.md, relevant domain context and ADRs first. Inspect relevant docs, code and bounded Git history. Start with `git log -20 --oneline -- <relevant paths>`; inspect specific commits when needed. No Git history/access: record gap, continue with available sources. Near-empty project: list missing context; never invent purpose or decisions.

Map purpose, ownership, constraints and current decisions. Reuse authoritative files; add concise links in context.md. Preserve unrelated text, domain ownership and existing definitions. No second knowledge tree, empty domain scaffolding or recursive loading of every link. Before writing, compare existing records; unchanged evidence needs no duplicate or prose churn.

Cite inspected paths and commit IDs for proposed conclusions. Code proves behaviour, not historical intent. Label inference and conflicting sources explicitly. Unresolved choice stays unresolved; never create accepted ADR from inference alone.

## Capture

When consequential choice settles, capture durable rationale immediately in docs/adr/ using .galicia/templates/adr.md. Follow relevant domain ownership and existing ADR numbering. Link relevant context/specs. Include decision, alternatives, reason and evidence. Cite user agreement when that settles the choice. Skip temporary progress and implementation facts recoverable from code.

Before consequential ADR work, recommend scoped small-model research/review with task, inputs and expected evidence. Spawn only when authorised. Existing agreement needs no repeated decision interview. Proposed or uncertain choices remain proposed; never invent acceptance.

## Reversal

Accepted ADR preserves original rationale. Changed decision: create successor with dated evidence and reason; mark predecessor superseded and link both directions. Update context navigation to current record. Read historical bodies only when needed. No silent rewriting or deletion.

Markdown stays directly editable. Validate links, lifecycle metadata and evidence after edits. CLI usage cannot guarantee all edits preserve contracts.
