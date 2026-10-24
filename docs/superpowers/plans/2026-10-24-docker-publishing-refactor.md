# Docker Image Publishing Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace tag parsing in the image release workflow with app-specific triggers while sharing the image publishing steps.

**Architecture:** Three small workflows select an app by tag prefix and call one reusable workflow. The reusable workflow validates the tag, extracts its version, creates stable and prerelease image tags, and builds one Dockerfile. Next.js callers pass the full Git tag as a nonsecret build argument.

**Tech Stack:** GitHub Actions reusable workflows, Docker Buildx, GHCR, Next.js, Turbo.

**Spec:** `docs/superpowers/specs/2026-10-24-docker-publishing-refactor.md`

## Global Constraints

- Preserve image paths `ghcr.io/<owner>/<repo>/<app>` and version-only image tags.
- Publish `latest` for stable versions only; prereleases publish only their version tag.
- Keep the full release tag as `NEXT_DEPLOYMENT_ID` for `scouting` and `basecamp-fe`; pass no deployment ID to `basecamp`.
- Keep the image public and pass no secrets as Docker build arguments.
- Do not run the old and replacement tag workflows together.
- Preserve existing changes in the two Next.js Dockerfiles and `turbo.json` that pass `NEXT_DEPLOYMENT_ID` to `next build`.

## Review Focus

- A tag with a missing version must stop before publishing an image: validate in Task 1.
- A prerelease must never move `latest`: inspect metadata for a prerelease in Task 1 and the first release smoke check in Task 3.
- A Basecamp release must not receive a Next.js build argument: inspect its caller in Task 2.
- A Next.js release must embed the full tag, including app prefix: inspect callers in Task 2 and a built image in Task 3.
- One tag must trigger only one publisher: inspect tag filters and deletion of the old workflow in Task 2.

---

### Task 1: Extract the shared publisher

**Files:**
- Create: `.github/workflows/_publish-docker-image.yml`

**Interfaces:**
- Consumes `workflow_call` inputs `app` (required string) and `build_args` (optional string, default empty).
- Produces `ghcr.io/${{ github.repository }}/${{ inputs.app }}` with a version tag and an optional stable `latest` tag.

- [ ] Add `workflow_call` inputs, a single Ubuntu job, and permissions `contents: read` and `packages: write`.
- [ ] Checkout the triggering tag. Set Docker Buildx and log in to GHCR with `github.actor` and `github.token`.
- [ ] Configure `docker/metadata-action` with a `type=semver` rule that matches the app's `<app>-v` tag prefix and emits `{{version}}`. Use `latest=auto` so stable releases move `latest` and prereleases do not.
- [ ] Stop before building if the metadata action produces no tags for a malformed release tag.
- [ ] Build and push from `apps/${{ inputs.app }}/Dockerfile`, pass `inputs.build_args`, and retain the existing GitHub Actions cache configuration.
- [ ] Run `actionlint .github/workflows/_publish-docker-image.yml`; expect no errors. Review the metadata rules with both `2026.26.0` and `2026.26.0-rc.1` before cutover.

### Task 2: Add explicit callers and remove the dispatcher

**Files:**
- Create: `.github/workflows/publish-basecamp.yml`
- Create: `.github/workflows/publish-basecamp-fe.yml`
- Create: `.github/workflows/publish-scouting.yml`
- Delete: `.github/workflows/release-docker-images.yml`

**Interfaces:**
- Each caller triggers only its own `<app>-v*` tag and calls `./.github/workflows/_publish-docker-image.yml`.
- Next.js callers pass `build_args: NEXT_DEPLOYMENT_ID=${{ github.ref_name }}`; Basecamp omits `build_args`.

- [ ] Add the three callers with their exact tag filters, `contents: read` and `packages: write` permissions, and the shared workflow call.
- [ ] Pass the app name in each caller. Pass the full-tag build argument in only the `basecamp-fe` and `scouting` callers.
- [ ] Delete the old dispatcher in the same commit so a release tag cannot publish twice.
- [ ] Run `actionlint .github/workflows/*.yml` and `git diff --check`; expect no errors. Inspect all three callers and confirm that each tag prefix appears in exactly one trigger.

### Task 3: Update documentation and verify a release

**Files:**
- Modify: `RELEASING.md`

**Interfaces:**
- Documents the actual tag-to-image mapping and Portainer pull instructions; introduces no new workflow behavior.

- [ ] Replace references to the removed dispatcher with the three caller workflows and the shared publisher.
- [ ] Remove the documented `main` image tag and `publish-basecamp.yml` main-branch claim unless a separate current workflow actually publishes that tag.
- [ ] State that each stable tag moves that app's `latest`, prereleases do not, and Portainer should deploy an explicit version for predictable rollback.
- [ ] On the next release tag for each app, confirm exactly one publish run, a version-tagged image, and correct `latest` behavior. For a Next.js image, check rendered HTML for the tag in `data-dpl-id` or static asset `?dpl=` URLs. For Basecamp, check that no Next.js build argument was passed.
