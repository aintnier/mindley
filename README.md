# Mindley

<img src="frontend/public/mindley-icon.svg" alt="Mindley logo" width="120" style="height:auto;" />

A small productivity and knowledge-sharing platform with a React + TypeScript frontend and a Supabase backend (Edge Functions written for Deno).

> [!NOTE]
> This README is a concise developer-focused reference. For detailed API docs or deployment runbooks check the `supabase/` folder and the `frontend/README.md`.

## Quick overview

- Frontend: React + TypeScript, Vite, Tailwind CSS.
- Backend: Supabase project with Deno-based Edge Functions in `supabase/functions/`.
- Local dev: Frontend runs with `npm run dev` (in `frontend/`); Supabase functions use the Supabase CLI for local serving.

## Key features

- Resource listing and detail pages
- Authentication (OTP sign-in flow) using Supabase
- Background job monitoring via Supabase Functions
- Small component library and UI primitives in `src/components/ui`

## Repository layout

```
frontend/                # React app (Vite + TypeScript)
  public/                # static assets (icons, manifest)
  src/                   # source code (components, pages, hooks, services)
supabase/                # Supabase project and Edge Functions (Deno)
  functions/             # serverless functions (create-resource, jobs, etc.)
package.json             # workspace-level scripts and tooling (if present)
README.md                # this file
```

## Getting started (local)

Prerequisites:

- Node 18+ (or project-compatible runtime)
- npm or pnpm
- Supabase CLI (for local testing of functions)

1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 (or the address printed by Vite).

2. Supabase functions (local)

```bash
# from repo root or inside the supabase directory
supabase login              # one-time, if not already logged in
supabase start              # optional local DB + emulators
supabase functions serve    # serve Edge Functions locally
```

3. Environment

Create a `.env.local` in `frontend/` (do not commit):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
```

## Scripts and common commands

From `frontend/`:

```bash
npm run dev      # start dev server
npm run build    # build production bundle
npm run preview  # preview production build locally
npm run lint     # run ESLint
npm run test     # run tests (project tests if configured)
```

Supabase / functions (examples):

```bash
deno check supabase/functions/*/index.ts    # type check functions
deno fmt supabase/functions/*/index.ts      # format functions
```

## Architecture notes

- Frontend organizes UI primitives under `src/components/ui` to keep shared building blocks.
- Services that talk to Supabase are in `src/services/` (e.g., `resourceService.ts`, `jobService.ts`).
- Hooks such as `use-auth` and `use-reliable-realtime` encapsulate auth state and realtime behaviors.

## CI / Deployment

- Frontend is designed to deploy to Vercel (see `frontend/vercel.json`).
- GitHub Actions run type checks, linters, build verification, and security scans for dependencies.
- Supabase functions are typically deployed using the Supabase CLI/CI; check the `.github/workflows` directory for CI workflow examples.

## Tests and quality gates

- Type checking: `tsc --noEmit` (frontend)
- Linting: ESLint configured in `frontend/eslint.config.js`
- Formatting: Prettier / Deno fmt for Supabase functions

## Useful paths

- Frontend entry: `frontend/src/main.tsx`
- UI components: `frontend/src/components/ui`
- Supabase functions: `supabase/functions/*/index.ts`

## Troubleshooting

> [!TIP]
> If the frontend can't connect to Supabase locally, double-check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `frontend/.env.local` and ensure `supabase start` (local emulators) is running when using local endpoints.

## Next steps / suggestions

- Add end-to-end tests (Cypress or Playwright) for the main flows (auth, resource CRUD).
- Add a small runbook for deploying Supabase functions with the CLI in CI.

---

Requirements coverage:

- Create a concise, useful README for the project — Done
- Use GFM and admonitions where helpful — Done
- Avoid sections like LICENSE/CONTRIBUTING/CHANGELOG — Done
- Include logo if present — Done (references `frontend/public/mindley-icon.svg`)

If you want, I can also update `frontend/README.md` to match this top-level README or generate a brief developer runbook next.
