# Contributing

Thanks for helping build the definitive AI-first mobile engineering toolkit! Contributions
of all sizes are welcome — fixing a typo, improving a skill, adding an agent, or proposing a
whole new section. The value of this repository depends on **consistency**, so this guide
explains how to keep everything coherent.

New here? Look for issues labeled **good first issue**, or open an issue describing what you'd
like to add before starting larger work.

## Ways to Contribute

You do **not** need to be an iOS engineer — contributions of every kind keep this toolkit
honest and useful:

| If you're a… | You can help by… |
|--------------|------------------|
| 📱 iOS / Swift dev | Sharpening agents, skills, and standards; adding production-tested patterns |
| 🤖 Android / Kotlin dev | Porting iOS skills to Kotlin/Compose (Android parity is on the roadmap) |
| 🦋 Flutter / cross-platform dev | Adding Flutter, React Native, or KMP equivalents |
| 🔌 Backend / API dev | Improving networking, API-contract, and integration workflows |
| 🧪 Tester / QA | Strengthening the testing agent, checklists, and test-strategy skills |
| 🛡️ Security reviewer | Auditing security standards and Keychain / crypto / pinning guidance |
| 🧐 Critic / reviewer | Running agents on real tasks and reporting where the output falls short |
| ✍️ Writer / typo hunter | Fixing typos, tightening wording, improving clarity and examples |
| 🌐 Web dev | Building a docs site or landing page (open an issue to claim it first) |
| 🎨 Designer | Improving diagrams, the logo / banner, and visual explanations |
| 💡 Anyone | Filing ideas and bug reports, starring, and sharing the repo |

**Not writing code?** Issues and feedback are first-class contributions. The most valuable
reports describe a real task you gave an agent, the output you got, and what a senior engineer
would have done instead — that directly drives what we fix.

**Porting to another platform?** Drop your file in the matching platform subfolder (see
[Repository layout](#repository-layout-platforms)) — e.g. a Kotlin secure-storage skill goes in
`skills/security/android/`. Mirror the iOS file's section template, add the `platform:`
front-matter, label code blocks with the right language (`kotlin`, `dart`), and cross-link the
iOS counterpart so the two stay in sync. Open an issue first for anything beyond a single file
so we can agree on scope.

> **Rebase on `main` before you start, and reference shared paths as they exist on `main`.**
> The layout evolves (e.g. templates now live under `templates/ios/`, not `templates/`). A
> branch cut before such a change can pass its own CI yet break links after merge, so rebase
> first and run `npm run lint` (it link-checks) before opening the PR.

## Repository Layout (platforms)

This toolkit is loaded as **context for an AI agent**, so the layout is optimized for an agent
that works on **one platform at a time**: platform lives in the *path* (a cheap signal the agent
reads without opening files), and genuinely shared material stays single-source so the agent can
never load two conflicting copies.

- **Platform-specific directories** carry per-platform subfolders. Code and APIs differ by
  platform, so each topic splits into `ios/`, `android/`, `flutter/`, `react_native/`:

  ```text
  skills/security/ios/keychain.md
  skills/security/android/keystore.md
  templates/ios/networking_layer/
  ```

- **Shared directories stay flat** — they describe concepts, rules, and procedures that hold
  across platforms: `standards/`, `architecture/`, `checklists/`, `workflows/`. Don't fork these
  per platform; if a rule is platform-specific, add a clearly labeled subsection instead.

  A whole *rule set* that is platform- or paradigm-scoped may instead live in its own flat,
  platform-named file in that directory — `standards/swiftui_standards.md`,
  `standards/uikit_standards.md`, `standards/flutter_standards.md`, `checklists/uikit_review.md`,
  `checklists/flutter_review.md`. The filename carries the scope; the directory is not forked. Use a
  labeled subsection when the difference is a paragraph, and a named file when it is a whole
  rule set.

- **Agents stay flat** and are distinguished by name (e.g. `swiftui_expert.md` vs a future
  `compose_expert.md`); they are selected individually, not globbed in bulk.

- **Every platform-specific file declares its platform in front-matter** so an agent (or tooling)
  can filter precisely:

  ```yaml
  ---
  platform: ios        # ios | android | flutter | react_native
  ---
  ```

  `_shared/` is reserved for a platform-neutral file inside an otherwise platform-split
  directory; such a file uses `platform: shared`.

  In a **flat shared directory**, a file carries `platform:` only when it is platform-scoped by
  name (e.g. `standards/flutter_standards.md`). **A file with no `platform:` key is shared and
  always loads** — absence of the key is the signal, so don't add `platform: shared` to a
  genuinely cross-platform file like `standards/git_standards.md`.

## How to Contribute

1. **Fork** the repo and create a branch: `git checkout -b feat/<short-name>`.
2. **Set up locally** (see [Local Setup](#local-setup)) so you can validate before pushing.
3. **Make your change**, following the [file section templates](#file-section-templates) and
   [style](#style).
4. **Commit** using the [Conventional Commit format](#commit-convention) — this is enforced in CI.
5. **Validate**: run `npm run lint` and confirm cross-links resolve.
6. **Open a pull request** using the template; fill in the checklist.

## Local Setup

The toolkit is markdown + illustrative Swift, plus the zero-dependency `npx @sok_pich/mobie` installer
in [`bin/mobie.js`](bin/mobie.js):

```bash
npm install                 # installs markdownlint, link-check, commitlint
npm test                    # installer tests (node:test, no dependencies)
npm run lint                # markdown lint + relative/external link check
npm run lint:md:fix         # auto-fix common markdown issues
git config commit.template .gitmessage   # (optional) prefill the commit format
```

CI runs the same checks on every PR, plus commit-message linting, so running them locally
saves a round-trip.

## Principles

1. **AI-first, not human-first.** Write for a coding agent reading the file as context.
   Be explicit, structured, and unambiguous. Prefer rules and checklists over prose.
2. **Focused files.** One file = one role / skill / workflow / topic. If a file covers
   two things, split it.
3. **Cross-link, don't duplicate.** Reference other files with relative links instead of
   repeating content. Duplication drifts out of sync.
4. **Illustrative code.** Snippets (Swift/SwiftUI, Kotlin/Compose, Dart, …) demonstrate the
   correct pattern; they need not compile as a whole project. Keep them idiomatic and current,
   and match the file's `platform:`.
5. **Standards are law.** New content must conform to [`standards/`](standards/).

## File Section Templates

Use the canonical section set for each content type. Do not invent new section names.

| Type | Required sections |
|------|-------------------|
| `agents/*` | Purpose · Responsibilities · Rules · Coding Standards · Review Checklist · Common Mistakes · Example Tasks |
| `skills/*` | Overview · Use Cases · Best Practices · Anti-Patterns · Checklist · *Language* Examples (Swift / Kotlin / Dart, matching `platform:`) · Common Interview Questions · AI Implementation Notes |
| `workflows/*` | Objective · Inputs · Outputs · Step-by-Step Process · Validation Steps · Failure Scenarios · AI Agent Instructions · Acceptance Criteria |
| `checklists/*` | Grouped checkbox items, each objective and measurable |
| `prompts/*` | Role · Objective · Constraints · Output Format · Quality Requirements |
| `standards/*` | Topic-grouped rules with ✅/❌ examples |
| `architecture/*` | Explanation · Mermaid diagram(s) · Data flow · Sample implementation |

## Style

- Markdown with ATX headings (`#`), one `H1` per file.
- Fenced code blocks **must** declare a language (`swift`, `kotlin`, `dart`, `bash`, `yaml`,
  `xml`, `mermaid`, `json`, `text`).
- Use `✅` for recommended and `❌` for discouraged examples.
- Keep line length reasonable (~100 chars) for diff readability.
- American English, present tense, imperative voice for instructions.

## Checklist Authoring Rules

Each checklist item must be:

- **Objective** — two reviewers would agree whether it passes.
- **Measurable** — ideally automatable (lint rule, test, grep).
- **Production-focused** — reflects real risk, not style preference (style → `standards/`).

## Commit Convention

All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/).
CI lints **every commit in a PR** and the **PR title** — non-conforming messages fail the build.

Format:

```text
<type>(<scope>): <subject>

<optional body — explain what and why>

<optional footer — e.g. Closes #123>
```

- **type** (required): `feat` · `fix` · `docs` · `refactor` · `test` · `chore` · `perf` ·
  `build` · `ci` · `revert`
- **scope** (optional): the area touched — common ones: `security`, `networking`, `ui`, `auth`,
  `storage`, `agents`, `skills`, `workflows`, `checklists`, `standards`, `architecture`,
  `prompts`, `templates`, `examples`, `ci`, `repo`.
- **subject** (required): imperative, lower-case, no trailing period, ≤ 100 chars total.

Examples:

```text
feat(security): add public-key TLS pinning with backup pin
fix(networking): map 404 to DomainError.notFound
docs(readme): clarify Cursor setup
chore(repo): add markdown link-check to CI
```

Run `git config commit.template .gitmessage` to prefill the format in your editor, and
`npm run lint:commits` to check your branch's commits before pushing. See
[`standards/git_standards.md`](standards/git_standards.md) for the full convention.

## Pull Requests

- Keep PRs scoped to one area (e.g. "add storage skills", not "misc updates").
- Update the relevant directory `README.md` index when adding a file.
- Verify cross-links resolve (`workflows/` references should point to real files).
- Run the docs checks locally: `npm run lint`.
- Use a Conventional Commit **PR title** (it's linted, and becomes the squash-merge commit).
- Follow [`standards/git_standards.md`](standards/git_standards.md) for commits and PR
  descriptions.

## Adding a New Agent or Skill

1. Copy the section template above.
2. Cross-link related agents/skills/workflows.
3. Add an entry to the directory `README.md` and, for agents, to the table in
   [`README.md`](README.md) and routing in [`AGENTS.md`](AGENTS.md).
4. If a new `.claude/agents/` subagent is platform-specific (only iOS, or only Flutter), add it to
   `PLATFORM_AGENTS` in [`bin/mobie.js`](bin/mobie.js) so `npx @sok_pich/mobie init` installs it only for
   that platform. A new top-level content folder must also be added to `CONTENT_DIRS` there and
   to `files` in `package.json`.
   A shared subagent must not name a platform-specific path such as `skills/<topic>/flutter/…`:
   that path isn't installed for other platforms, and `npx @sok_pich/mobie doctor` reports it as broken.

## Releasing to npm

Releases use npm trusted publishing (no stored token) and staged publishing: CI can only
stage a version, and a maintainer makes it public with 2FA.

1. Bump `version` in `package.json` (semver) and merge to `main`.
2. Tag the merge commit: `git tag v1.2.3 && git push origin v1.2.3`.
3. The [`npm package`](.github/workflows/npm.yml) workflow runs the tests and the `npx` smoke
   test, checks that the tag matches `package.json`, and stages the version with provenance.
4. Approve it (prompts for 2FA). Inspect first with `npm stage view` / `npm stage download`, or
   discard it with `npm stage reject`:

   ```bash
   npm stage list @sok_pich/mobie
   npm stage approve <stage-id>
   ```

The trusted publisher on npmjs.com is configured for `sokpichdev/mobie`, workflow `npm.yml`,
environment `npm`. Renaming the workflow file or the environment breaks publishing until the npm
settings are updated to match.
