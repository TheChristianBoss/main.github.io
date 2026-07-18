# Building and deploying the site applications

The repository contains five buildable browser applications:

- ATS Checker → `tools/ats/`
- Resume Builder → `tools/resume/`
- Cover Letter Builder → `tools/cover/`
- File Converter → `tools/converter/`
- Asset Forge → `tools/asset-forge/`

The video editor is not included in this build because its editable source code is not present in this repository.

## First-time setup

From the repository root in PowerShell:

```powershell
npm run setup
```

This installs the root application dependencies and Asset Forge's separate dependencies.

## Build every application

```powershell
npm run build
```

The build coordinator:

1. Builds each app into a temporary staging directory.
2. Verifies the generated entry page and its local assets.
3. Promotes `ats-index.html` and `resume-index.html` to their canonical `index.html` paths automatically.
4. Preserves the ATS and Resume favicon/icon files.
5. Replaces the deployed app directory only after its staged build passes verification.
6. Removes obsolete nested deployments such as `tools/resume/resume/`.
7. Runs a final verification pass across all five apps.

If a build fails, the currently deployed directory is restored from a temporary backup.

## Build one application

```powershell
npm run build:ats
npm run build:resume
npm run build:cover
npm run build:converter
npm run build:asset-forge
```

Each command performs the same staging, canonical-entry, deployment, and verification steps as the full build.

## Verify committed build output

```powershell
npm run build:verify
```

Verification fails when an app is missing `index.html`, references a missing local bundle, contains no generated JavaScript, leaves an `ats-index.html` or `resume-index.html` deployment file behind, or still contains an obsolete same-name nested deployment.

## Build-system test

```powershell
npm run test:build-system
```

## Clean generated bundles

```powershell
npm run clean:builds
```

This removes generated `assets/` directories and temporary build folders. Run `npm run build` afterward before committing or deploying.

## Development servers

```powershell
npm run dev:ats
npm run dev:resume
npm run dev:cover
npm run dev:converter
npm run dev:asset-forge
```

## Normal deployment workflow

```powershell
npm run build
npm run test:build-system
npm run build:verify
git status
git add package.json .gitignore BUILDING.md scripts tests vite.*.config.js tools
git commit -m "Unify application builds"
git push
```

GitHub Pages serves the committed static output. No manual copying of generated HTML files is required.
