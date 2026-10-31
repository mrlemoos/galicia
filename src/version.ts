import { readFile } from 'node:fs/promises';

export const releaseVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export async function installedVersion(): Promise<string> {
  const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  if (typeof version !== 'string' || !releaseVersion.test(version)) throw new Error('Invalid Galicia package version.');
  return version;
}
