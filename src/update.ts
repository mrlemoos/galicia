import { releaseVersion } from './version.ts';

export const latestReleaseUrl = 'https://api.github.com/repos/mrlemoos/galicia/releases/latest';
export const upgradeCommand = 'brew update && brew upgrade mrlemoos/galicia/galicia';
export const updateTimeoutMs = 1_500;

// Best effort. No cache, project paths, credentials or telemetry sent.
export async function updateNotice(installed: string, request: typeof fetch = fetch): Promise<string | null> {
  if (process.env.GALICIA_NO_UPDATE_CHECK === '1' || !releaseVersion.test(installed)) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  try {
    const lookup = async () => {
      const response = await request(latestReleaseUrl, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': `galicia/${installed}` },
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const release: unknown = await response.json();
      if (!release || typeof release !== 'object') return null;
      const { tag_name: tag, draft, prerelease } = release as Record<string, unknown>;
      if (draft !== false || prerelease !== false || typeof tag !== 'string') return null;
      const available = tag.replace(/^v/, '');
      if (!releaseVersion.test(available) || available === installed) return null;
      return `Galicia ${available} available. Installed: ${installed}.\nUpgrade: ${upgradeCommand}`;
    };
    return await Promise.race([
      lookup(),
      new Promise<null>(resolve => { timer = setTimeout(() => { controller.abort(); resolve(null); }, updateTimeoutMs); }),
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
