import { readFile, lstat, mkdir, writeFile, open, rename, unlink, realpath } from 'node:fs/promises';
import { resolve, dirname, parse, relative, join } from 'node:path';
import { homedir } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { inside } from './check-specs.ts';

export const skills = ['terse', 'rubberduck', 'spec', 'breakdown', 'find-rc'] as const;
export const agents = ['codex', 'claude', 'cursor', 'grok'] as const;
export type Agent = typeof agents[number];
export type Skill = typeof skills[number];
export type Options = { project: string; agents: Agent[]; skills: Skill[]; cadence: 'ask' | 'one' | 'batch'; hooks: boolean };
export type Change = { path: string; before: string | null; after: string; state: 'create' | 'update' | 'same' | 'conflict' };
export const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

export async function safePath(root: string, path: string): Promise<void> {
  if (!inside(root, path)) throw new Error(`Path outside project: ${path}`);
  let current = root;
  for (const part of relative(root, path).split(/[\\/]/).filter(Boolean)) {
    current = join(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw new Error(`Refusing symlink: ${current}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}

async function existing(path: string): Promise<string | null> {
  try { return await readFile(path, 'utf8'); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected JSON object.');
  return value as Record<string, unknown>;
}

export function mergeHook(body: string | null, agent: Agent): string {
  const config = body === null ? {} : object(JSON.parse(body));
  const hooks = config.hooks === undefined ? {} : object(config.hooks);
  const event = agent === 'cursor' ? 'sessionStart' : 'SessionStart';
  const configured = hooks[event];
  if (configured !== undefined && !Array.isArray(configured)) throw new Error(`Invalid ${event} hooks array.`);
  const entries: unknown[] = configured === undefined ? [] : configured;
  const command = agent === 'codex'
    ? 'node "$(git rev-parse --show-toplevel)/.galicia/startup.ts" codex'
    : agent === 'claude'
      ? 'node "$CLAUDE_PROJECT_DIR/.galicia/startup.ts" claude'
      : 'node .galicia/startup.ts cursor';
  const handler = { type: 'command', command, timeout: 5 };
  const already = entries.some((entry: unknown) => {
    const item = object(entry);
    if (agent === 'cursor') return item.command === command;
    return Array.isArray(item.hooks) && item.hooks.some((value: unknown) => object(value).command === command);
  });
  if (!already) entries.push(agent === 'cursor' ? { command, timeout: 5 } : { matcher: 'startup|resume', hooks: [handler] });
  hooks[event] = entries;
  config.hooks = hooks;
  if (agent === 'cursor') {
    if (config.version !== undefined && config.version !== 1) throw new Error('Unsupported Cursor hook schema version.');
    config.version = 1;
  }
  return `${JSON.stringify(config, null, 2)}\n`;
}

const guidance = `## Galicia\n\nRead context.md first; load relevant domain context only. Domain terms: docs/Language.md. Decisions: docs/adr/. Specs/tickets: docs/specs/. Local Markdown only. No emojis. Preserve checks, exact contracts and uncertainty. Before consequential ADR work, recommend scoped small-model research/review; spawn only when authorised.\n\nStartup review fallback: run \`node .galicia/check.ts\` once per session if no startup hook ran. Metadata flags are review candidates; never delete without explicit user approval. Follow relevant specs to compare implementation when needed; age alone proves nothing. Grilling cadence: read .galicia/config.json, ask user if unset.\n`;

export async function planInstall(options: Options, source = sourceRoot): Promise<{ root: string; changes: Change[] }> {
  const root = await realpath(options.project);
  if (root === parse(root).root || root === await realpath(homedir())) throw new Error('Choose a project directory, not home or filesystem root.');
  if (!options.agents.length || !options.skills.length || options.agents.some(a => !agents.includes(a)) || options.skills.some(s => !skills.includes(s))) throw new Error('Choose valid agents and skills.');
  if (!['ask', 'one', 'batch'].includes(options.cadence)) throw new Error('Invalid grilling cadence.');
  await safePath(root, resolve(root, '.galicia/manifest.json'));
  const receipt = await existing(resolve(root, '.galicia/manifest.json'));
  const owned = receipt ? object(object(JSON.parse(receipt)).files) : {};
  const changes: Change[] = [];
  async function add(path: string, after: string, merge: boolean) {
    const target = resolve(root, path);
    await safePath(root, target);
    const before = await existing(target);
    const state = before === after ? 'same' : before === null ? 'create' : merge || owned[path] === hash(before) ? 'update' : 'conflict';
    changes.push({ path, before, after, state });
  }
  const load = (path: string) => readFile(resolve(source, path), 'utf8');
  for (const skill of options.skills) {
    const text = await load(`${skill}/SKILL.md`);
    // Cursor also discovers .claude skills; use one copy when Claude selected.
    if (options.agents.includes('claude')) await add(`.claude/skills/${skill}/SKILL.md`, text, false);
    else if (options.agents.includes('codex') || options.agents.includes('cursor')) await add(`.agents/skills/${skill}/SKILL.md`, text, false);
    if (options.agents.includes('grok')) await add(`.galicia/prompts/${skill}.md`, text.replace(/^---\n[\s\S]*?\n---\n/, ''), false);
    if (options.agents.includes('codex') && options.agents.includes('claude')) await add(`.agents/skills/${skill}/SKILL.md`, text, false);
  }
  for (const [path, template] of Object.entries({ 'context.md': 'context.md', 'docs/Language.md': 'language.md', 'docs/adr/README.md': 'adr-readme.md', 'docs/specs/README.md': 'specs-readme.md' })) {
    await safePath(root, resolve(root, path));
    // Existing domain context remains authoritative, even when Galicia generated it.
    await add(path, await existing(resolve(root, path)) ?? await load(`templates/${template}`), false);
  }
  for (const [path, body] of [['AGENTS.md', guidance], ...(options.agents.includes('claude') ? [['CLAUDE.md', '@AGENTS.md\n']] : [])]) {
    await safePath(root, resolve(root, path!));
    const before = await existing(resolve(root, path!));
    const marker = '<!-- galicia:start -->';
    const end = '<!-- galicia:end -->';
    const block = `${marker}\n${body}${end}`;
    if (before?.includes(marker) && !before.includes(end)) throw new Error(`Incomplete Galicia block in ${path}.`);
    const after = before?.includes(marker) ? before.replace(/<!-- galicia:start -->[\s\S]*?<!-- galicia:end -->/, block) : `${before ?? ''}${before ? '\n\n' : ''}${block}\n`;
    const existingBlock = before?.match(/<!-- galicia:start -->[\s\S]*?<!-- galicia:end -->/)?.[0];
    await add(path!, after, !existingBlock || existingBlock === block);
  }
  await add('.galicia/config.json', `${JSON.stringify({ version: 1, agents: options.agents, skills: options.skills, cadence: options.cadence, hooks: options.hooks }, null, 2)}\n`, false);
  await add('.galicia/package.json', '{"private":true,"type":"module"}\n', false);
  await add('.galicia/check-specs.ts', await load('src/check-specs.ts'), false);
  await add('.galicia/startup.ts', await load('src/startup.ts'), false);
  await add('.galicia/check.ts', "import { scanSpecs, scanSummary } from './check-specs.ts';\nimport { dirname, resolve } from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst scan = await scanSpecs(resolve(dirname(fileURLToPath(import.meta.url)), '..'));\nconsole.log(scanSummary(scan) || `No metadata flags in ${scan.inspected} inspected specs. Semantic implementation review not performed.`);\n", false);
  await add('.galicia/NOTICE.md', await load('NOTICE.md'), false);
  await add('.galicia/LICENSE', await load('LICENSE'), false);
  if (options.hooks) for (const agent of options.agents) {
    if (agent === 'grok') continue;
    const path = agent === 'claude' ? '.claude/settings.json' : `.${agent}/hooks.json`;
    await safePath(root, resolve(root, path));
    await add(path, mergeHook(await existing(resolve(root, path)), agent), true);
  }
  const files = Object.fromEntries(changes.filter(c => c.state !== 'conflict').map(c => [c.path, hash(c.after)]));
  await add('.galicia/manifest.json', `${JSON.stringify({ version: 1, files }, null, 2)}\n`, true);
  return { root, changes };
}

export async function applyPlan(root: string, changes: Change[]): Promise<void> {
  if (changes.some(c => c.state === 'conflict')) throw new Error('Conflicts found. Preserve files; resolve or choose another project before retrying.');
  const pending = changes.filter(c => c.state !== 'same');
  for (const change of pending) {
    await safePath(root, resolve(root, change.path));
    if (await existing(resolve(root, change.path)) !== change.before) throw new Error(`File changed after preview: ${change.path}`);
  }
  const written: Change[] = [];
  try {
    for (const change of pending) {
      const path = resolve(root, change.path);
      await safePath(root, path);
      await mkdir(dirname(path), { recursive: true });
      const temp = `${path}.${randomUUID()}.tmp`;
      // Open before cleanup scope: a colliding file belongs to somebody else.
      const handle = await open(temp, 'wx');
      try {
        try { await handle.writeFile(change.after); }
        finally { await handle.close(); }
        await rename(temp, path);
      } finally { await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
      written.push(change);
    }
  } catch (error) {
    for (const change of written.reverse()) {
      const path = resolve(root, change.path);
      await safePath(root, path);
      if (await existing(path) !== change.after) continue;
      if (change.before === null) await unlink(path);
      else await writeFile(path, change.before);
    }
    throw error;
  }
}
