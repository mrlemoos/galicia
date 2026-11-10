import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { scanSpecs, scanSummary } from './check-specs.ts';
import { agents, skills, planInstall, applyPlan, sealPlan } from './install.ts';
import type { Agent, Skill, Options, Resolution } from './install.ts';
import { ask, banner, choose, ink } from './terminal.ts';
import { installedVersion } from './version.ts';
import { updateNotice } from './update.ts';

const help = `galicia / resource-conscious engineering\n\nNode >=22.18. Skills and context stay project-local.\n\n  galicia init [--project PATH]\n  galicia init --agents codex,claude,cursor,grok --skills terse,rubberduck,spec,breakdown,find-rc,unit-test,behavioural-test,e2e-test,commit --cadence ask --hooks --yes\n  galicia init --agents codex --cadence one --dry-run\n  galicia check [--project PATH]\n  galicia --version\n\n  --agents     codex,claude,cursor,grok\n  --skills     selected skill names; default all\n  --cadence    ask,one,batch; default ask for non-interactive use\n  --hooks      merge project startup hooks; off unless selected\n  --dry-run    preview paths and full contents; no writes\n  --on-conflict keep or take for every owned edit; default interactive keep\n  --yes        apply displayed plan without confirmation\n  --help       show usage\n  --version    show installed version\n\nUnowned files update. Owned edits prompt keep or take. --yes does not choose take. Grok gets pasteable Markdown, no hook.\nSource checkout: node src/cli.ts <command>\nGALICIA_NO_UPDATE_CHECK=1 skips the release lookup. Help/version work offline.\nDownload pinned source: node scripts/download.ts --help\n`;

let notice: Promise<string | null> | undefined;
try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    project: { type: 'string' }, agents: { type: 'string' }, skills: { type: 'string' }, cadence: { type: 'string' },
    'on-conflict': { type: 'string' },
    hooks: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, yes: { type: 'boolean' }, help: { type: 'boolean' }, version: { type: 'boolean' },
  } });
  if (values['on-conflict'] !== undefined && !['keep', 'take'].includes(values['on-conflict'])) throw new Error('Invalid --on-conflict. Use keep or take.');
  if (values.version) console.log(await installedVersion());
  else if (values.help || !positionals.length) console.log(help);
  else {
    const [command, ...extra] = positionals;
    if (extra.length) throw new Error(`Unexpected argument: ${extra[0]}`);
    if (command === 'init' || command === 'check') notice = updateNotice(await installedVersion());
    const project = resolve(values.project ?? process.cwd());
    if (command === 'check') {
      const result = await scanSpecs(project);
      console.log(scanSummary(result) || `No metadata flags in ${result.inspected} inspected specs. Semantic implementation review not performed.`);
    } else if (command === 'init') {
      banner();
      console.log(`Project: ${project}\nSelections preview files before anything is written.\n`);
      const selectedAgents = values.agents?.split(',') ?? (process.stdin.isTTY && !values.yes ? await choose('01 / Agent targets. Select where skills are installed.', agents, ['codex']) : ['codex']);
      const selectedSkills = values.skills?.split(',') ?? (process.stdin.isTTY && !values.yes ? await choose('02 / Skills', skills, [...skills]) : [...skills]);
      const cadence = values.cadence ?? (process.stdin.isTTY && !values.yes ? (await choose('03 / Questions. ask: decide each time; one: one at a time; batch: grouped.', ['ask', 'one', 'batch'], ['ask'], false))[0] : 'ask');
      const hooks = values.hooks ?? (process.stdin.isTTY && !values.yes && !values['dry-run'] ? (await choose('04 / Spec review. manual: run yourself; hooks: run when agents start.', ['manual', 'hooks'], ['manual'], false))[0] === 'hooks' : false);
      const options: Options = { project, agents: [...new Set(selectedAgents)] as Agent[], skills: [...new Set(selectedSkills)] as Skill[], cadence: cadence as Options['cadence'], hooks };
      const plan = await planInstall(options);
      const root = plan.root;
      let changes = plan.changes;
      console.log(`\n${ink.blue('05 / File preview')}\n${ink.muted(root)}\n`);
      console.log('create: new file / update: replace or merge / keep: preserved edit / conflict: decision needed');
      for (const change of changes.filter(c => c.state !== 'same')) console.log(`  ${change.state.padEnd(8)} ${change.path}`);
      console.log(ink.muted(`${changes.filter(c => c.state === 'same').length} unchanged files omitted.`));
      const conflicts = changes.filter(c => c.state === 'conflict');
      const showContents = (change: typeof changes[number]) => console.log(`\n--- ${change.path} / before ---\n${change.before ?? '(absent)'}\n--- after ---\n${change.path === '.galicia/manifest.json' && changes.some(c => c.state === 'conflict') ? '(sealed after conflict choices)' : change.after}`);
      if (values['dry-run']) changes.filter(c => c.state !== 'same' && c.state !== 'keep').forEach(showContents);
      else if (conflicts.length) {
        if (!values['on-conflict'] && !process.stdin.isTTY) throw new Error(`Conflicting files: ${conflicts.map(c => c.path).join(', ')}. Nothing written. Retry with --on-conflict=keep to preserve edits or --on-conflict=take to replace them.`);
        const resolutions: Record<string, Resolution> = {};
        for (const change of conflicts) {
          showContents(change);
          resolutions[change.path] = values['on-conflict'] as Resolution | undefined ?? (await choose('Resolve edit. keep: preserve your file; take: replace with Galicia copy.', ['keep', 'take'], ['keep'], false))[0] as Resolution;
        }
        changes = sealPlan(changes, resolutions);
        console.log('\nResolved files:');
        for (const change of changes.filter(c => conflicts.some(conflict => conflict.path === c.path))) console.log(`  ${change.state.padEnd(8)} ${change.path}`);
      }
      const count = changes.filter(c => c.state === 'create' || c.state === 'update').length;
      const kept = changes.filter(c => c.state === 'keep').length;
      console.log(`\n${count} files to write; ${kept} kept; ${values['dry-run'] ? conflicts.length + ' conflicts to resolve' : 'ready for confirmation'}.`);
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
} finally {
  const message = await notice;
  if (message) console.error(`\n${message}`);
}

// All work and terminal cleanup completed. Native readline can retain input handles.
if (process.stdin.isTTY) process.exit(Number(process.exitCode ?? 0));
