---
name: version-bump
description: Instructions for bumping versions in metadata.json and package.json, compiling schemas, and bundling the extension zip.
---

# GNOME Extension Version Bump

Use this skill when preparing a new version release for GNOME Extensions store submission.

## Steps

### 1. Update Version Numbers

1. **`metadata.json`**:
   - Increment `"version"` (EGO Store integer counter, e.g. `7` -> `8`).
   - Update `"version-name"` (Semantic version string, e.g. `"1.0.4"` -> `"1.0.5"`).

2. **`package.json`**:
   - Update `"version"` to match the semantic version string (e.g. `"1.0.5"`).

### 2. Compile Schemas & Build Package

Run the schema compilation and Node build script:

```bash
glib-compile-schemas ./schemas
node build.mjs
```

Or via `./install.sh` if testing locally.

### 3. Verify Output Artifacts

- Ensure `daynight-theme-sync@phenrique-coder.github.com.zip` is generated at the project root.
- Verify compiled schemas exist in `schemas/gschemas.compiled`.
