# Galicia website

Astro marketing site. pnpm workspace package `@galicia/website`. System typography, existing Galicia artwork, accessible skill tabs and clipboard installation command. Static output; no account, analytics or backend.

Requires Node 22.23.4+ and pnpm 12.10.1. From repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check:website
pnpm build
pnpm --filter @galicia/website preview
```

Development URL: http://localhost:4321. Production files: `website/dist/`. Source: `src/pages/index.astro`, styles: `src/styles/global.css`, static assets: `public/`. Temporary screenshots belong in root `.scratch/`.

Check desktop and mobile layouts, tab clicks and arrow-key navigation, clipboard success/failure, reduced motion and visible keyboard focus. Skill exchanges are illustrative, not measured model results. Installation executes remote code; page links to the setup script before use.

## Production

Vercel project: `galicia`, team: `leonardo-lemos-projects-68535f8a`. Custom domain: `galicia.mrlemoos.dev`. DNS managed by Cloudflare. Deploy the locally checked static build using Vercel CLI and its Build Output API. Requires authenticated Vercel CLI in addition to workspace prerequisites.

From repository root:

```sh
pnpm check:website
pnpm build
node --input-type=module -e 'import fs from "node:fs"; fs.rmSync("website/.vercel/output", { recursive: true, force: true }); fs.mkdirSync("website/.vercel/output/static", { recursive: true }); fs.cpSync("website/dist", "website/.vercel/output/static", { recursive: true }); fs.writeFileSync("website/.vercel/output/config.json", JSON.stringify({ version: 3 }));'
vercel deploy --prebuilt --prod --yes --cwd website --scope leonardo-lemos-projects-68535f8a
```

First checkout only: `vercel link --yes --project galicia --scope leonardo-lemos-projects-68535f8a --cwd website`. Linking data and local environment files stay ignored. This workflow uploads static output; it does not configure Git deployments.
