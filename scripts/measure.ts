import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { getEncoding } from 'js-tiktoken';
import { skills, sourceRoot } from '../src/install.ts';

try {
  const { values } = parseArgs({ options: {
    matt: { type: 'string' }, caveman: { type: 'string' }, markdown: { type: 'boolean' }, help: { type: 'boolean' },
  } });
  if (values.help) console.log('node scripts/measure.ts [--matt PATH_TO_UPSTREAM_SKILLS_ROOT] [--caveman PATH_TO_ORIGINAL_SKILL_MD] [--markdown]\nCounts full SKILL.md, frontmatter included, with cl100k_base and o200k_base. Optional original files read locally; only hashes/counts output. These encodings do not prove actual model billing or Claude/Grok token counts.');
  else {
    const baselines: Record<string, string | undefined> = {
      terse: values.caveman,
      rubberduck: values.matt && resolve(values.matt, 'productivity/grilling/SKILL.md'),
      spec: values.matt && resolve(values.matt, 'engineering/to-spec/SKILL.md'),
      breakdown: values.matt && resolve(values.matt, 'engineering/to-tickets/SKILL.md'),
      'find-rc': values.matt && resolve(values.matt, 'engineering/diagnosing-bugs/SKILL.md'),
    };
    const encodings = ['cl100k_base', 'o200k_base'] as const;
    const counters = encodings.map(name => [name, getEncoding(name)] as const);
    const rows = [];
    for (const skill of skills) {
      const text = await readFile(resolve(sourceRoot, skill, 'SKILL.md'), 'utf8');
      const original = baselines[skill] ? await readFile(baselines[skill]!, 'utf8') : null;
      const counts = Object.fromEntries(counters.map(([name, encoder]) => {
        const current = encoder.encode(text).length;
        const baseline = original === null ? null : encoder.encode(original).length;
        return [name, { current, baseline, reductionPercent: baseline ? Number((100 * (1 - current / baseline)).toFixed(1)) : null }];
      }));
      rows.push({ skill, sha256: createHash('sha256').update(text).digest('hex'), baselineSha256: original === null ? null : createHash('sha256').update(original).digest('hex'), counts });
    }
    if (values.markdown) {
      console.log('# Instruction token measurements\n\nFull SKILL.md including frontmatter. js-tiktoken 1.x. Exact counts for named encodings, not provider billing. Sources: installed Matt Pocock 1.3.1 and user-provided Caveman skill when baseline arguments supplied.\n\n| Skill | cl100k original / Galicia | Reduction | o200k original / Galicia | Reduction |\n|---|---:|---:|---:|---:|');
      for (const row of rows) {
        const a = row.counts.cl100k_base!;
        const b = row.counts.o200k_base!;
        console.log(`| ${row.skill} | ${a.baseline ?? 'unmeasured'} / ${a.current} | ${a.reductionPercent ?? 'unmeasured'}% | ${b.baseline ?? 'unmeasured'} / ${b.current} | ${b.reductionPercent ?? 'unmeasured'}% |`);
      }
      console.log('\nCounts exclude setup guidance, config reads, hook output and tool use. Terse adds resource rules; a negative reduction means larger than original. Claude/Grok token counts, output/reasoning savings and behavioural equivalence unmeasured. Intentional workflow changes documented in eval/README.md.\n\n## Source fingerprints\n');
      for (const row of rows) console.log(`- ${row.skill}: Galicia \`${row.sha256}\`; original \`${row.baselineSha256 ?? 'not supplied'}\`.`);
    } else console.log(JSON.stringify({ encodings, scope: 'instruction files only; no runtime savings claim', rows }, null, 2));
  }
} catch (error) {
  console.error(`Measurement failed: ${(error as Error).message}`);
  process.exitCode = 1;
}
