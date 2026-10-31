import { constants } from 'node:fs';
import { copyFile, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { sourceRoot, skills } from '../src/install.ts';
import { installedVersion } from '../src/version.ts';

export function homebrewFormula(version: string, sha256: string): string {
  return `class Galicia < Formula
  desc "Concise engineering skills and project-local context for coding agents"
  homepage "https://github.com/mrlemoos/galicia"
  url "https://github.com/mrlemoos/galicia/releases/download/v${version}/galicia-${version}.tar.gz"
  sha256 "${sha256}"
  license "MIT"

  depends_on "node"

  def install
    libexec.install "src", "templates", "package.json", "LICENSE", "NOTICE.md", ${skills.map(skill => `"${skill}"`).join(', ')}
    bin.mkpath
    (bin/"galicia").write <<~SH
      #!/bin/sh
      export PATH="#{Formula["node"].opt_bin}:$PATH"
      exec "#{Formula["node"].opt_bin}/node" "#{libexec}/src/cli.ts" "$@"
    SH
    (bin/"galicia").chmod 0755
  end

  test do
    assert_equal "${version}", shell_output("#{bin}/galicia --version").strip
    ENV["GALICIA_NO_UPDATE_CHECK"] = "1"
    project = testpath/"project"
    project.mkpath
    cd project do
      system bin/"galicia", "init", "--agents", "codex,claude,cursor,grok", "--hooks", "--yes"
      assert_path_exists project/".agents/skills/terse/SKILL.md"
      assert_path_exists project/".claude/skills/spec/SKILL.md"
      assert_path_exists project/".galicia/prompts/find-rc.md"
      assert_match "Already initialised", shell_output("#{bin}/galicia init --agents codex,claude,cursor,grok --hooks --yes")
      system bin/"galicia", "check"
      system Formula["node"].opt_bin/"node", project/".galicia/check.ts"
    end
  end
end
`;
}

export async function buildRelease(output: string, tag: string): Promise<void> {
  const version = await installedVersion();
  if (tag !== `v${version}`) throw new Error(`Tag must match package.json: v${version}.`);
  const destination = resolve(output);
  await mkdir(destination, { recursive: true });
  if ((await readdir(destination)).length) throw new Error('Release output directory must be empty.');
  const temporary = await mkdtemp(join(tmpdir(), 'galicia-release-'));
  try {
    const name = `galicia-${version}`;
    const stage = join(temporary, name);
    await mkdir(stage);
    // Explicit runtime inputs exclude local project data, dependencies and experiments.
    for (const path of ['src', 'templates', ...skills, 'package.json', 'README.md', 'LICENSE', 'NOTICE.md']) {
      await cp(join(sourceRoot, path), join(stage, path), { recursive: true });
    }
    const archiveName = `${name}.tar.gz`;
    const archive = join(temporary, archiveName);
    const tar = spawnSync('tar', ['-czf', archive, '-C', temporary, name], {
      encoding: 'utf8', timeout: 30_000, env: { ...process.env, COPYFILE_DISABLE: '1' },
    });
    if (tar.error) throw tar.error;
    if (tar.status !== 0) throw new Error(`Archive failed: ${tar.stderr}`);
    const sha256 = createHash('sha256').update(await readFile(archive)).digest('hex');
    await copyFile(archive, join(destination, archiveName), constants.COPYFILE_EXCL);
    await writeFile(join(destination, 'galicia.rb'), homebrewFormula(version, sha256), { flag: 'wx' });
    await writeFile(join(destination, 'SHA256SUMS'), `${sha256}  ${archiveName}\n`, { flag: 'wx' });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { output: { type: 'string' }, tag: { type: 'string' }, help: { type: 'boolean' } } });
    if (values.help) console.log('node scripts/release.ts --tag vVERSION [--output .scratch/release]\nRequires Node >=22.18 and tar. Tag must match package.json. Output must be empty. Produces runtime archive, SHA256SUMS and Homebrew formula. No publication.');
    else {
      if (!values.tag) throw new Error('--tag required.');
      const output = values.output ?? '.scratch/release';
      await buildRelease(output, values.tag);
      console.log(`Release prepared: ${resolve(output)}`);
    }
  } catch (error) {
    console.error(`Galicia release: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}
