# Docker image publishing refactor

Each release tag publishes exactly one public GHCR image: `basecamp-v*`, `basecamp-fe-v*`, or `scouting-v*` selects the corresponding `apps/<app>/Dockerfile` and image path. Preserve the version-only image tag, and update `latest` only for stable releases. A malformed tag must fail clearly rather than publish an incorrectly named image.

The two Next.js images receive the full Git tag as `NEXT_DEPLOYMENT_ID` at build time. Basecamp does not receive that argument. Keep the existing Dockerfile and Turbo environment wiring for the Next.js builds.

Use a small caller workflow per app and one reusable workflow for common checkout, GHCR login, metadata, build, cache, and push behavior. Keep GitHub token permissions to `contents: read` and `packages: write`. Cut over without allowing both the old and new workflows to publish the same tag. Update release documentation to match the workflows that exist.

This refactor does not change GHCR visibility, Portainer deployment, or Server Action compatibility guarantees.
