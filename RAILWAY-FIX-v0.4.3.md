# Railway registry fix v0.4.3

This patch fixes Railway dependency installation by:

- replacing private build-environment package URLs in `package-lock.json` with the public npm registry;
- adding a project `.npmrc` that explicitly uses `https://registry.npmjs.org/`;
- using a deterministic Node 22 Docker build;
- keeping the Railway health check at `/api/health`.

Copy the patch files into the repository root, replace matching files, commit, and push.
