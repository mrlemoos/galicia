import { parseArgs } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

try {
  const { values } = parseArgs({ options: {
    repo: { type: 'string' }, ref: { type: 'string' }, project: { type: 'string' }, help: { type: 'boolean' },
  } });
  if (values.help) console.log('node scripts/download.ts --repo OWNER/REPO --ref FULL_40_CHARACTER_COMMIT --project PATH\nRequires Git + Node >=22.18. Downloads pinned GitHub commit, runs reviewed source installer interactively, then removes temporary download. No global installation. Repository/commit must be trusted; downloaded TypeScript executes locally. Public source: https://github.com/mrlemoos/galicia.');
  else {
    if (!values.repo || !/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(values.repo)) throw new Error('Use GitHub OWNER/REPO.');
    if (!values.ref || !/^[a-f0-9]{40}$/i.test(values.ref)) throw new Error('Pin full 40-character commit SHA; branches/tags rejected.');
    const project = resolve(values.project ?? process.cwd());
    const temporary = await mkdtemp(join(tmpdir(), 'galicia-'));
    try {
      console.log(`Galicia / downloading ${values.repo}@${values.ref}\nInstaller will run from this trusted commit. Destination: ${project}`);
      execFileSync('git', ['init', '--quiet', temporary]);
      execFileSync('git', ['-C', temporary, 'fetch', '--quiet', '--depth=1', `https://github.com/${values.repo}.git`, values.ref], { stdio: 'inherit', timeout: 120_000 });
      const actual = execFileSync('git', ['-C', temporary, 'rev-parse', 'FETCH_HEAD'], { encoding: 'utf8' }).trim();
      if (actual.toLowerCase() !== values.ref.toLowerCase()) throw new Error('Downloaded commit mismatch.');
      execFileSync('git', ['-C', temporary, 'checkout', '--quiet', '--detach', actual]);
      const child = spawnSync(process.execPath, [join(temporary, 'src/cli.ts'), 'init', '--project', project], { stdio: 'inherit' });
      if (child.error) throw child.error;
      process.exitCode = child.status ?? 1;
    } finally { await rm(temporary, { recursive: true, force: true }); }
  }
} catch (error) {
  console.error(`Galicia download: ${(error as Error).message}`);
  process.exitCode = 1;
}
