// Keep valid JavaScript too: README pipes this TypeScript source into Node.
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { openSync, closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const revision = '050d4835a5e0032230f6a358567771ea3ec4e73d';
const arguments_ = process.argv.slice(2);
let temporary;
let terminal;
try {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 18)) throw new Error('Node >=22.18 required.');
  if (spawnSync('tar', ['--version'], { stdio: 'ignore' }).status !== 0) throw new Error('tar required.');
  // Piped source occupies stdin. Give interactive installer its own terminal.
  if (!arguments_.includes('--yes') && !arguments_.includes('--dry-run')) {
    try { terminal = openSync('/dev/tty', 'r'); }
    catch { throw new Error('Interactive terminal required. Run setup from a terminal window.'); }
  }
  temporary = await mkdtemp(join(tmpdir(), 'galicia-setup-'));
  console.log(`Galicia / downloading mrlemoos/galicia@${revision}`);
  const response = await fetch(`https://codeload.github.com/mrlemoos/galicia/tar.gz/${revision}`, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}.`);
  const archive = join(temporary, 'source.tar.gz');
  await writeFile(archive, new Uint8Array(await response.arrayBuffer()));
  const unpack = spawnSync('tar', ['-xzf', archive, '-C', temporary], { stdio: 'inherit', timeout: 30_000 });
  if (unpack.error) throw unpack.error;
  if (unpack.status !== 0) throw new Error('Cannot unpack source archive.');
  const child = spawnSync(process.execPath, [join(temporary, `galicia-${revision}`, 'src/cli.ts'), 'init', '--project', process.cwd(), ...arguments_], { stdio: [terminal ?? 'inherit', 'inherit', 'inherit'] });
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
} catch (error) {
  console.error(`Galicia setup: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (terminal !== undefined) closeSync(terminal);
  if (temporary) await rm(temporary, { recursive: true, force: true });
}
