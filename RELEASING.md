# Releasing

This project uses [Release Please](https://github.com/googleapis/release-please) to automate versioning, changelog generation, and Docker image releases.

## How It Works

1. **Write conventional commits** - use the format described below
2. **Open a PR** - Release Please only reads the PR title (since we squash merge)
3. **Merge to main** - Release Please automatically creates or updates a release PR
4. **Merge the release PR** - this creates git tags, GitHub Releases, and triggers Docker image builds

You never need to manually type a version number. Release Please calculates it from your commits.

## Conventional Commits

Since we use **squash merging**, the PR title becomes the commit message on `main`. PR titles are validated by CI to ensure they follow the [Conventional Commits](https://www.conventionalcommits.org/) format.

### Format

```
<type>(<scope>): <description>
```

### Types

| Type       | Description                     | Version Bump |
|------------|---------------------------------|-------------|
| `feat`     | A new feature                   | Minor        |
| `fix`      | A bug fix                       | Patch        |
| `perf`     | Performance improvement         | Patch        |
| `revert`   | Reverts a previous commit       | Patch        |
| `chore`    | Maintenance, deps, etc.         | None         |
| `docs`     | Documentation only              | None         |
| `style`    | Formatting, whitespace          | None         |
| `refactor` | Code change (no feature or fix) | None         |
| `test`     | Adding or fixing tests          | None         |
| `ci`       | CI/CD changes                   | None         |
| `build`    | Build system changes            | None         |

### Scopes

Use the app name as the scope to attribute the change to the correct app:

- `basecamp` - Backend (NestJS)
- `basecamp-fe` - Basecamp frontend (Next.js)
- `scouting` - Scouting frontend (Next.js)
- `deps` - Dependency updates

For packages, use the package name as the scope:

- `ui` - UI components (Radix UI)
- `ai` - shared AI functionality
- `tba-sdk` - TBA SDK (TBA API)
- `typescript-config` - TypeScript configuration (tsconfig.json)
- `vitest-config` - Vitest configuration (vitest.config.ts)

Scopes are optional but recommended.

### Examples

```bash
# Features (minor version bump)
feat(basecamp): add discord notification support
feat(scouting): implement climb tracking UI
feat(basecamp-fe): add dark mode toggle

# Bug fixes (patch version bump)
fix(scouting): resolve timer reset bug
fix(basecamp): correct JWT expiration handling

# Breaking changes (major version bump)
feat(basecamp)!: redesign API response format
fix(scouting)!: rename scoring endpoints

# No version bump
chore(deps): update dependencies
docs(scouting): improve README
ci: add PR title linting
refactor(basecamp): extract auth middleware
```

### Breaking Changes

Add `!` after the type/scope to indicate a breaking change:

```plaintext
feat(basecamp)!: redesign API response format
```

Or include `BREAKING CHANGE:` in the PR body:

```plaintext
feat(basecamp): redesign API response format

BREAKING CHANGE: response format changed from array to object
```

## Versioning Strategy

### Basecamp & Basecamp-FE

Standard [semantic versioning](https://semver.org/):

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features
- **Patch** (1.0.0 → 1.0.1): Bug fixes

### Scouting

Year-based versioning where the major version is the current year:

- **Format**: `2026.minor.patch`
- **Minor** (2026.1.0 → 2026.2.0): New features
- **Patch** (2026.1.0 → 2026.1.1): Bug fixes
- **Year rollover**: At the start of 2027, manually update `apps/scouting/package.json` to `2027.0.0`

#### Manual Version Update

Normally, you never need to manually bump version numbers except in rare circumstances (such as the annual year rollover in Scouting or to correct an out-of-band release).

##### How to Manually Update the Version

1. **Update the package version**

   Edit the relevant `package.json`:

   - For Scouting:  
     `apps/scouting/package.json`
   - For other apps/packages:  
     Update the respective `package.json` (e.g., `apps/basecamp/package.json`).

   Change the `"version"` field to the desired version, e.g.:

   ```json
   {
     "version": "2027.0.0"
   }
   ```

2. **Commit the change**

   Use a conventional commit message. For example, after a year rollover for Scouting:

   ```plaintext
   chore(scouting): bump version to 2027.0.0
   ```

3. **Push and create a PR**

   - Push your branch and open a PR.  
   - The PR will trigger the normal release process (Release Please will pick up the new version).

4. **Merge PR to main**

   - Merging the PR will run Release Please.  
   - Release Please will create a release PR if changelog or other release files need updating.  
   - Merge the new release PR if created.

##### Notes

- For Scouting year rollover, only the `version` field needs to be updated to the new year (`202X.0.0`).
- Manual version changes should be rare and usually only needed at the start of a new year for Scouting or to resolve versioning issues.
- Do **not** edit CHANGELOG.md directly; Release Please manages changelogs automatically.
- For packages with multiple apps, only bump the versions relevant to the change.

> If you need to trigger a release without a code change, follow the above steps and bump the patch version (e.g., `2026.1.2` → `2026.1.3`) with a commit such as `chore: bump patch version for release workflow`.

Scouting uses prereleases during active development:

- `2026.1.0-alpha.1` → `2026.1.0-beta.1` → `2026.1.0`

## Docker Images

Docker images are hosted on GitHub Container Registry (GHCR).

### Image Tags

| Tag | When Updated | Example |
| -------- | ------------- | --------- |
| `{version}` | Every release | `ghcr.io/yeti3506/polar-edge/basecamp:1.2.3` |
| `latest` | Stable releases only | `ghcr.io/yeti3506/polar-edge/basecamp:latest` |
| `main` | Every push to main (CI) | `ghcr.io/yeti3506/polar-edge/basecamp:main` |

Prerelease versions (e.g., `2026.1.0-alpha.1`) do **not** update the `latest` tag.

### Pulling Images

```bash
# Latest stable release
docker pull ghcr.io/yeti3506/polar-edge/basecamp:latest

# Specific version
docker pull ghcr.io/yeti3506/polar-edge/scouting:2026.1.0

# Latest from main (CI build, may not be stable)
docker pull ghcr.io/yeti3506/polar-edge/basecamp:main
```

## Release Workflow

### Automated (Normal)

```plaintext
PR merged to main
       ↓
Release Please runs
       ↓
Creates/updates release PR with version bump + CHANGELOG
       ↓
Merge release PR when ready
       ↓
Release Please creates:
  - Git tag (e.g., basecamp-v1.2.0)
  - GitHub Release with changelog
       ↓
Docker build workflow triggers:
  - Builds image from Dockerfile
  - Pushes to GHCR with version tags
```

### Manual Override (Emergency)

If you need to trigger a Docker build without going through Release Please:

```bash
git tag basecamp-v1.2.3
git push --tags
```

This will trigger the Docker build workflow directly.

## Changelogs

Each app maintains its own `CHANGELOG.md`:

- `apps/basecamp/CHANGELOG.md`
- `apps/basecamp-fe/CHANGELOG.md`
- `apps/scouting/CHANGELOG.md`

These are automatically updated by Release Please when a release PR is merged. Changelogs are also available on the [GitHub Releases](../../releases) page.

## Rollback

To roll back a deployment:

1. Identify the previous working version from GitHub Releases
2. Pull the specific version: `docker pull ghcr.io/yeti3506/polar-edge/basecamp:1.1.0`
3. Deploy the older image
4. Fix the issue in a new PR and release a patch version

## CI Workflows

| Workflow | Trigger | Purpose |
| -------- | ------- | ------- |
| `status-checks.yml` | Push to main, PRs | Lint, test, typecheck, build |
| `pr-title-lint.yml` | PR open/edit | Validates conventional commit format |
| `release-please.yml` | Push to main | Creates/updates release PRs |
| `release-docker-images.yml` | Tag push | Builds and pushes Docker images |
| `publish-basecamp.yml` | Push to main | CI builds with `main` tag |
