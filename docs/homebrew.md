# Homebrew distribution

Homebrew manages the shared `galicia` command and Node. Project setup still previews changes, preserves edits and writes only to the selected project. Node runtime packages not required. Native compilation not involved.

## Install and upgrade

After the first release publishes the formula:

```sh
brew tap mrlemoos/galicia https://github.com/mrlemoos/galicia
brew install mrlemoos/galicia/galicia
cd /path/to/project
galicia init
galicia --version
```

Explicit URL required because this repository is named `galicia`, not `homebrew-galicia`. Formula lives in `Formula/galicia.rb`, generated during release. Homebrew may request formula trust. Recent Homebrew supports explicit trust with `brew trust --formula mrlemoos/galicia/galicia`.

```sh
brew update && brew upgrade mrlemoos/galicia/galicia
```

Upgrade changes CLI only. Rerun `galicia init` per project to preview installed-file updates. Existing customisations retain conflict protection.

## Version reminder

`init` and `check` start a public request to `https://api.github.com/repos/mrlemoos/galicia/releases/latest`. CLI waits at most 1.5 seconds total for headers/body, alongside normal setup. Network, HTTP and malformed-response failures stay silent; command result preserved. Help, no-command usage and `--version` make no request.

Stable `X.Y.Z` release required. Optional `v` prefix normalised. Drafts/prereleases ignored. Any different version prints installed version, available version and Homebrew upgrade command on stderr. This includes local builds ahead of the public release, as requested. For source/bootstrap users, the displayed upgrade command applies to Homebrew installations.

No cache or background process. Request sends Galicia version in User-Agent, no credentials, project paths or project contents. Disable with `GALICIA_NO_UPDATE_CHECK=1 galicia init`.

## Prepare locally

Requires Node >=22.18 and tar. No dependency install required for packaging. From repository root:

```sh
node scripts/release.ts --help
node scripts/release.ts --tag v0.1.0 --output .scratch/release
```

Tag must equal `v` plus `package.json` version. Output directory must be empty. For another preview, choose another directory under `.scratch/`.

Outputs:

- `galicia-VERSION.tar.gz`, explicit runtime source/assets, package version and licence notices. Excludes workspace context, installed agent files, dependencies, website and experiments.
- `galicia.rb`, formula with release URL, archive SHA-256, Node dependency, quoted launcher and installation tests.
- `SHA256SUMS`, archive checksum.

Generated outputs stay ignored under `.scratch/`. Release workflow copies the published formula into `Formula/`. No hand-maintained checksum or separate tap repository.

## Publish

Requires Git checkout of `mrlemoos/galicia`, GitHub Actions enabled and workflow token allowed to push `Formula/galicia.rb` to `main`. Protected branches need an appropriate bot permission or a reviewed manual formula commit. Package version must still match the tag on `main` when publishing.

1. Update root `package.json` version for each release. Commit reviewed source and workflow to `main`.
2. Run `pnpm install --frozen-lockfile`, `pnpm run check`, `pnpm test`.
3. In GitHub Actions, select `Release Homebrew CLI`, choose `Run workflow` on `main`, enter the matching stable tag, e.g. `v0.1.0`. CLI alternative: `gh workflow run release.yml --ref main -f tag=v0.1.0`, requires authenticated GitHub CLI with Actions write access. Existing tag route remains available: `git tag v0.1.0` followed by `git push origin v0.1.0`.
4. Workflow packages runtime and checksum. Actual Homebrew installation/test runs on macOS and Linux against that archive through a temporary tap.
5. After both pass, workflow creates a draft GitHub release at the validated source commit, creating the tag if absent, commits formula to `main`, then publishes stable release as latest. First publication makes the install commands available.

Manual dispatch packages `main` and requires its package version to match the requested stable tag. Existing tags must resolve to the packaged commit. Concurrent releases queue without cancelling running validation.

Treat tags/assets as immutable. If publication stops after draft creation, inspect draft assets and formula commit before recovery. Preserve the original archive/checksum pair; do not replace an existing release archive with a rebuilt file. A formula push may fail under branch protection; draft remains unpublished.

## Validation boundaries

`pnpm test` checks relocated archive setup, all agent assets/hooks, repeat installation, customised-file conflict rejection, source version, checksum agreement, invalid tags, occupied output, upgrade reminders and offline/timeout behaviour. Tests mock release responses; no live release required.

Workflow adds actual `brew install` and `brew test` on macOS/Linux before publication. Local TypeScript tests alone do not prove Homebrew installation, GitHub workflow execution, public release availability or agent startup delivery. [Homebrew tap conventions](https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap), [formula cookbook](https://docs.brew.sh/Formula-Cookbook), [GitHub release API](https://docs.github.com/en/rest/releases/releases#get-the-latest-release).
