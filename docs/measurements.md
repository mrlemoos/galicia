# Instruction token measurements

Full SKILL.md including frontmatter. js-tiktoken 1.x. Exact counts for named encodings, not provider billing. Sources: installed Matt Pocock 1.3.1 and user-provided Caveman skill when baseline arguments supplied.

| Skill | cl100k original / Galicia | Reduction | o200k original / Galicia | Reduction |
|---|---:|---:|---:|---:|
| terse | 456 / 238 | 47.8% | 449 / 237 | 47.2% |
| rubberduck | 440 / 264 | 40% | 432 / 260 | 39.8% |
| spec | 643 / 341 | 47% | 632 / 333 | 47.3% |
| breakdown | 1267 / 320 | 74.7% | 1270 / 318 | 75% |
| find-rc | 2040 / 404 | 80.2% | 2034 / 400 | 80.3% |

Counts exclude setup guidance, config reads, hook output and tool use. Terse adds resource rules; a negative reduction means larger than original. Claude/Grok token counts, output/reasoning savings and behavioural equivalence unmeasured. Intentional workflow changes documented in eval/README.md.

## Source fingerprints

- terse: Galicia `0f05d61833721a180c83c43beeb3c34fcfe81c70745106582dd640910d221929`; original `b4bb6fe3bf3da222993ca0aee5e7c6f5368b182dd30ce1172e8f8e3280eb7052`.
- rubberduck: Galicia `3ca4c5973dc6d12498a251804941f4b1effda3eff7ed2fb0850250d42dbf0fb2`; original `befdff1e27a1dfe2a294d5871169ac1afe16d983911daa4f32627514a48c1e15`.
- spec: Galicia `50095b592eb866065d49b031772dda0b380bf666fb197b4885402d45bb794861`; original `43ad9cf318e5e7d3d1fa360253a37021796dc87a0c2e595ad262661a10f85088`.
- breakdown: Galicia `3b1b6a7fb0f84a19eac744162e4e0b905f88372ca7b83edd98dfbce526a4df03`; original `56ec23c5b2782785d4e65bff9e315b6d3aeb4ef977c174a219e99489fada1995`.
- find-rc: Galicia `71a79a526e74456689f44c28b9410df73710a296895776bf3d46ea65b50045bd`; original `849198df88cdb65fd0d97236604c1fca7ff2f22d2f705f9724a800d0266b118d`.
