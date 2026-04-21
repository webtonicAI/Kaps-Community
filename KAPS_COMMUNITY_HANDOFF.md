# Kaps Community — handoff

This document orients anyone working on **Kaps** who lands in the public [Kaps-Community](https://github.com/webtonicAI/Kaps-Community) repo.

## What this repo is for

- **Issues** — bug reports, feature ideas, and discussion that do not require access to the private Kaps application codebase.
- **Instructions** — setup steps, workflows, and contributor-facing docs that can be shared publicly.
- **Community** — announcements, FAQs, and pointers to where help is coordinated.

The **implementation** of Kaps lives in a **private** repository. This repo does not mirror that code; it exists so contributors and users can collaborate without that access.

## What belongs here vs the private repo

| Here (public)                         | Private Kaps repo                          |
|--------------------------------------|--------------------------------------------|
| Issue tracking and public discussion | Source code, secrets, proprietary assets   |
| Contributor docs and how-tos         | Internal architecture and implementation   |
| Release notes aimed at users         | CI/CD and deployment specifics (if secret) |

## Conventions (fill in as you go)

- **Default branch:** `main` (align with GitHub).
- **Labels:** Define issue labels for `bug`, `enhancement`, `documentation`, `question`, etc., in GitHub **Issues → Labels**.
- **Linking:** In the private repo’s README or team docs, link to this repo’s Issues URL: `https://github.com/webtonicAI/Kaps-Community/issues`.

## First-time maintainer checklist

1. Push an initial commit from this folder (see below).
2. Add a short **README** at the repo root when you are ready (project name, what Kaps is in one paragraph, link to Issues).
3. Optional: add **issue templates** (`.github/ISSUE_TEMPLATE/`) for bug reports and feature requests.
4. Pin important issues or discussions as the community grows.

## Local git (this folder)

```bash
git init
git branch -M main
git remote add origin https://github.com/webtonicAI/Kaps-Community.git
git add KAPS_COMMUNITY_HANDOFF.md
git commit -m "Add community handoff document"
git push -u origin main
```

If `origin` already exists, use `git remote set-url origin https://github.com/webtonicAI/Kaps-Community.git` instead of `git remote add`.

---

*Last updated: initial handoff.*
