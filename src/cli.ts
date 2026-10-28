import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { scanSpecs, scanSummary } from './check-specs.ts';
import { agents, skills, planInstall, applyPlan } from './install.ts';
import type { Agent, Skill, Options } from './install.ts';
import { ask, banner, choose, ink } from './terminal.ts';

const help = `galicia / resource-conscious engineering\n\nNode >=22.18. Project-local only.\n\n  node src/cli.ts init [--project PATH]\n  node src/cli.ts init --agents codex,claude,cursor,grok --skills terse,rubberduck,spec,breakdown,find-rc --cadence ask --hooks --yes\n  node src/cli.ts init --agents codex --cadence one --dry-run\n  node src/cli.ts check [--project PATH]\n\n  --agents     codex,claude,cursor,grok\n  --skills     selected skill names; default all\n  --cadence    ask,one,batch; default ask for non-interactive use\n  --hooks      merge project startup hooks; off unless selected\n  --dry-run    preview paths and full contents; no writes\n  --yes        apply displayed plan without confirmation\n  --help       show usage\n\nConflicts abort installation; existing user edits preserved. Grok gets pasteable Markdown, no hook.\nDownload pinned source: node scripts/download.ts --help\n`;

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    project: { type: 'string' }, agents: { type: 'string' }, skills: { type: 'string' }, cadence: { type: 'string' },
    hooks: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, yes: { type: 'boolean' }, help: { type: 'boolean' },
  } });
  if (values.help || !positionals.length) console.log(help);
  else {
    const [command, ...extra] = positionals;
    if (extra.length) throw new Error(`Unexpected argument: ${extra[0]}`);
    const project = resolve(values.project ?? process.cwd());
    if (command === 'check') {
      const result = await scanSpecs(project);
      console.log(scanSummary(result) || `No metadata flags in ${result.inspected} inspected specs. Semantic implementation review not performed.`);
    } else if (command === 'init') {
      banner();
      const selectedAgents = values.agents?.split(',') ?? await choose('01 / Agent targets', agents, ['codex']);
      const selectedSkills = values.skills?.split(',') ?? (process.stdin.isTTY && !values.yes ? await choose('02 / Skills', skills, [...skills]) : [...skills]);
      const cadence = values.cadence ?? (process.stdin.isTTY && !values.yes ? (await choose('03 / Rubberduck cadence', ['ask', 'one', 'batch'], ['ask'], false))[0] : 'ask');
      const hooks = values.hooks ?? (process.stdin.isTTY && !values.yes && !values['dry-run'] ? (await choose('04 / Startup spec review', ['manual', 'hooks'], ['manual'], false))[0] === 'hooks' : false);
      const options: Options = { project, agents: [...new Set(selectedAgents)] as Agent[], skills: [...new Set(selectedSkills)] as Skill[], cadence: cadence as Options['cadence'], hooks };
      const { root, changes } = await planInstall(options);
      console.log(`\n${ink.blue('05 / File preview')}\n${ink.muted(root)}\n`);
      for (const change of changes) console.log(`  ${change.state.padEnd(8)} ${change.path}`);
      if (values['dry-run']) for (const change of changes.filter(c => c.state !== 'same')) {
        console.log(`\n--- ${change.path} / before ---\n${change.before ?? '(absent)'}\n--- after ---\n${change.after}`);
      }
      if (changes.some(c => c.state === 'conflict')) throw new Error('Conflicting files listed. Nothing written. Review existing files before retrying.');
      const count = changes.filter(c => c.state !== 'same').length;
      if (values['dry-run']) console.log(`\nPreview only. ${count} proposed changes; nothing written.`);
      else if (!count) console.log(`\n${ink.green('Already initialised.')} No changes.`);
      else {
        if (!values.yes && !/^y(es)?$/i.test(await ask(`Apply ${count} changes?`, 'no'))) throw new Error('Cancelled. Nothing written.');
        await applyPlan(root, changes);
        console.log(`\n${ink.green('Galicia ready.')} ${count} files written.\nRead context.md. Restart selected agents to discover skills.\nManual review: node .galicia/check.ts\n`);
        if (hooks) console.log('Hooks configured from documented schemas. Trust/review in agent required; runtime delivery not verified by installer. Codex hook path requires Git.');
        if (options.agents.includes('grok')) console.log('Grok: paste selected .galicia/prompts/*.md plus relevant context; no filesystem/hook integration assumed.');
      }
    } else throw new Error(`Unknown command: ${command}. Use --help.`);
  }
} catch (error) {
  console.error(`Galicia: ${(error as Error).message}`);
  process.exitCode = 1;
}

// All work and terminal cleanup completed. Native readline can retain input handles.
if (process.stdin.isTTY) process.exit(Number(process.exitCode ?? 0));
