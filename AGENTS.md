# Repository Guidelines

## Project Structure & Module Organization

This repository is the source for `nssa.io`, an Astro 5 static site using TypeScript and Tailwind CSS. GitHub: `https://github.com/Matthewyin/nssa`.

- `src/pages/` contains routes, including English routes under `src/pages/en/`.
- `src/layouts/` contains shared page shells; `src/components/` contains reusable UI.
- `src/content/posts/` stores Markdown content by category: `business`, `tech`, `psychology`, `workplace`, and `history`.
- `src/styles/global.css` and `tailwind.config.js` define styling.
- `public/` stores static assets.
- `n8n.json` documents the Google Drive to local posts to GitHub to Firebase automation.
- `.github/workflows/firebase-hosting.yml`, `firebase.json`, and `deploy.sh` define deployment.

Use the nested article pattern:

```text
src/content/posts/{category}/{article-slug}/index.md
```

## Commands

- `npm install`: install local dependencies.
- `npm run dev`: start the Astro development server.
- `npm run check`: run Astro and TypeScript validation.
- `npm run build`: build the static site into `dist/`.
- `npm run preview`: preview the built site locally.
- `./deploy.sh`: install dependencies, build, and deploy to Firebase Hosting.

CI uses Node.js 20, `npm ci`, and `npm run build` for pushes and pull requests to `main`.

## Publishing Workflow

Articles normally originate in Google Drive. n8n exports each document as Markdown, generates frontmatter, downloads images or Mermaid output, writes `src/content/posts/{category}/{slug}/`, commits, and pushes to GitHub. GitHub Actions then deploys to Firebase Hosting.

## Coding Style & Naming Conventions

Use existing Astro, TypeScript, and Tailwind patterns. Keep shared UI in `src/components/`.

Use 2-space indentation. Keep frontmatter aligned with `src/content/config.ts`. Valid post categories are `business`, `tech`, `psychology`, `workplace`, and `history`; valid languages are `zh` and `en`.

## Testing Guidelines

There is no separate unit test suite. Before submitting changes, run:

```bash
npm run check
npm run build
```

For content changes, verify frontmatter, local image paths, and import overwrite risk.

## Commit & Pull Request Guidelines

Recent history mostly uses automated messages like `自动发布：批量更新文档`, with occasional conventional commits.

For manual commits, use short, action-oriented messages. Prefer `docs:`, `fix:`, `feat:`, or a clear Chinese summary when matching existing automation.

Pull requests should include a concise description, affected paths or categories, validation commands, and screenshots for UI changes. For automation changes, list affected n8n nodes.

## Security & Configuration Tips

Do not commit Firebase keys, Google Drive credentials, n8n credentials, SSH keys, local env files, or private tokens. Keep deployment secrets in GitHub Actions and automation credentials in n8n.
