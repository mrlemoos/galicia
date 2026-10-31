import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

type Release = { tag_name: string; draft: boolean; prerelease: boolean };
const stableVersion = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

export function planRelease(version: string, releases: Release[]): { tag: string; publish: boolean } {
  if (!stableVersion.test(version)) throw new Error('package.json requires a stable X.Y.Z version.');
  const tag = `v${version}`;
  const existing = releases.find(release => release.tag_name === tag);
  if (existing?.draft) throw new Error(`Recover existing draft ${tag} before retrying publication.`);
  if (existing) return { tag, publish: false };
  const parts = version.split('.').map(BigInt);
  for (const release of releases) {
    const previous = release.tag_name.replace(/^v/, '');
    if (release.draft || release.prerelease || !stableVersion.test(previous)) continue;
    const older = previous.split('.').map(BigInt);
    const difference = parts.findIndex((part, index) => part !== older[index]);
    if (difference === -1 || parts[difference] < older[difference]) {
      throw new Error(`Version ${version} must exceed published ${previous}.`);
    }
  }
  return { tag, publish: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
  const pages = JSON.parse(readFileSync(process.argv[2], 'utf8')) as Release[][];
  const plan = planRelease(version, pages.flat());
  console.log(`tag=${plan.tag}\npublish=${plan.publish}`);
}
