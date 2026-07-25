---
name: github-release
description: Procedure for committing changes, tagging releases, pushing to GitHub, and creating GitHub Releases with zip assets.
---

# GitHub Extension Release Procedure

Use this skill when publishing a new version release to GitHub after fixing issues or bumping versions.

## Workflow

### 1. Stage and Commit Source Files

Stage changed source files (excluding ignored build artifacts like `.zip` or `out/`):

```bash
git add metadata.json package.json src/extension.js src/others/darkLightSwitch.js
git commit -m "fix(review): update to version 1.0.5 (store 8) and address EGO review feedback"
```

### 2. Create Tag

Create an annotated git tag matching the version string (e.g. `v1.0.5`):

```bash
git tag -a v1.0.5 -m "Release v1.0.5"
```

### 3. Push Commit and Tag

Push both `main` branch and the tag to remote:

```bash
git push origin main
git push origin v1.0.5
```

### 4. Create GitHub Release with Zip Asset

Use the GitHub CLI (`gh`) to publish the release with the bundled extension zip attached:

```bash
gh release create v1.0.5 daynight-theme-sync@phenrique-coder.github.com.zip \
  --title "v1.0.5" \
  --notes "Release v1.0.5 - EGO review fixes and updates"
```
