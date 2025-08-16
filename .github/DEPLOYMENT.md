Vercel deploy hook flow

This repository uses a two-step deployment flow:

1. The `CI Pipeline` workflow runs tests, linting and build.
2. When `CI Pipeline` completes successfully on `main`, the `Vercel Deploy` workflow triggers a Vercel Deploy Hook to start the Vercel build.

Setup steps:

- In your Vercel project settings, create a Deploy Hook (Project Settings → Git → Deploy Hooks) and copy the hook URL.
- In the GitHub repository, add a secret named `VERCEL_DEPLOY_HOOK_URL` containing the full hook URL.

Notes:

- This prevents Vercel from building on every push; it will only build after CI passes.
- If you want to allow automatic deploys for other branches, update the workflow condition accordingly.
