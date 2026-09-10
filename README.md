<div align="center">

# 📱 Mobile Engineering Agents

## Turn your AI coding agent into a Senior mobile engineer

A drop-in knowledge system that gives **Claude Code, Codex, Cursor, Windsurf, Gemini CLI, and Aider**
the judgment of an experienced mobile team — architecture, security, testing, and standards — so the
code they generate is production-grade, not just plausible.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-mobie.sokpich.dev-blue.svg)](https://mobie.sokpich.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/focus-iOS%20%7C%20Swift%20%7C%20SwiftUI-orange.svg)](#whats-inside)
[![AI-ready](https://img.shields.io/badge/AI-Claude%20%C2%B7%20Codex%20%C2%B7%20Cursor%20%C2%B7%20Windsurf%20%C2%B7%20Gemini%20%C2%B7%20Aider-blueviolet.svg)](#how-to-use-the-agents)
<img alt="" src="https://komarev.com/ghpvc/?username=sokpichdev&color=blueviolet"/>

[Docs Site](https://mobie.sokpich.dev) · [Quick Start](#quick-start) · [What's Inside](#whats-inside) · [The Agent Team](#the-agent-team) · [How to Use](#how-to-use-the-agents) · [How It Works](#how-it-works) · [Workflows](#example-workflows)

</div>

---

## Why this exists

AI agents can write a lot of mobile code, fast. The bottleneck isn't typing — it's **engineering
judgment**: picking the right architecture, getting concurrency and error handling right, securing
data, and keeping the codebase maintainable as it grows.

> **Without this toolkit:** "Build me a login screen" → a Massive View Controller with the token in
> `UserDefaults` and no tests.
>
> **With it:** the agent acts as a Security Expert + SwiftUI Expert — OAuth2 + PKCE, Keychain
> storage, MVVM, typed errors, and unit tests — then self-reviews against a checklist.

This repo encodes that judgment as machine-loadable **agents, skills, workflows, checklists,
templates, prompts, standards, and architecture references**. Primary focus: **iOS / Swift /
SwiftUI** (with legacy **UIKit + MVP** codebases supported as a first-class paradigm); secondary: **Android/Kotlin** and **Flutter**.

It is **not** a tutorial or handbook. It's an operational toolkit you point your AI agent at.

---

## Quick Start

Get running in three steps. The everyday workflow needs **zero file paths**.

### 1. Clone the toolkit into your project

```bash
cd your-project
git clone https://github.com/sokpichdev/mobile-engineering-agents.git .mobile-agents
echo ".mobile-agents/" >> .gitignore   # optional: keep it out of your repo
```

The hidden `.mobile-agents/` folder keeps the toolkit from cluttering your own files.

### 2. Wire up the entry file for your tool

```bash
echo "@.mobile-agents/CLAUDE.md" > CLAUDE.md             # Claude Code
echo "@.mobile-agents/.cursorrules" > .cursorrules       # Cursor
echo "@.mobile-agents/.windsurfrules" > .windsurfrules   # Windsurf
```

The `@` import pulls in the full toolkit. Codex (`AGENTS.md`) and Gemini CLI (`GEMINI.md`)
auto-load their entry files straight from the cloned folder — no extra step.

### 3. Describe what you want

```text
> Build a Profile screen that loads /me and stores the auth token securely.
```

On its first reply of every session, the agent confirms it loaded:

```text
Mobile Engineering Agents — loaded ✓
```

See that line and you're wired in — the agent now routes every plain-language request to the
right experts and scales its process to the task. Head to
[How to Use the Agents](#how-to-use-the-agents) for the full usage model.

### Confirm & keep updated

- **Quick check:** start a session — the `loaded ✓` line should head the reply.
- **Deterministic check:** run `./verify.sh` (or `!verify` in-session, which runs
  [`workflows/verify_setup.md`](workflows/verify_setup.md)) to validate every entry-point
  file and the agent/skill/workflow/checklist counts.
- **Update:** `cd .mobile-agents && git pull`.

---

## What's Inside

| Directory | What it gives your agent | Count |
|-----------|--------------------------|-------|
| [`agents/`](agents/) | Loadable expert roles (architect, security, testing…) | 17 |
| [`skills/`](skills/) | Deep, single-topic know-how (auth, websockets, caching…) | 54 |
| [`workflows/`](workflows/) | Step-by-step procedures (build a feature, integrate an API…) | 13 |
| [`checklists/`](checklists/) | Objective, automatable review gates | 10 |
| [`standards/`](standards/) | Non-negotiable rules (coding, security, testing, git) | 10 |
| [`architecture/`](architecture/) | Reference designs with Mermaid diagrams | 6 |
| [`prompts/`](prompts/) | Copy-paste prompts for common tasks | 10 |
| [`templates/`](templates/) | Scaffolding with boilerplate Swift and Dart | 12 |
| [`examples/`](examples/) | Reference apps (banking, chat, CoffeeCraft, ecommerce, social) | 5 |

Plus [`AGENTS.md`](AGENTS.md) (orchestration), [`GLOSSARY.md`](GLOSSARY.md) (shared terms), and a
`README.md` index inside every directory.

---

## Docs Site

Everything above is browsable at **[mobie.sokpich.dev](https://mobie.sokpich.dev)** — a landing page
plus the entire toolkit rendered as searchable docs.

<div align="center">
  <a href="https://mobie.sokpich.dev">
    <img alt="mobie.sokpich.dev — the Mobile Engineering Agents docs site and landing page" src="https://mobie.sokpich.dev/og.png" width="720">
  </a>
</div>

- **[Landing page](https://mobie.sokpich.dev)** — the pitch: before/after code, the four-tier agent map, live inventory counts
- **[Introduction](https://mobie.sokpich.dev/introduction)** — this README, rendered
- **[Orchestration](https://mobie.sokpich.dev/AGENTS)** — [`AGENTS.md`](AGENTS.md), the routing table
- **Section indexes** — [Agents](https://mobie.sokpich.dev/agents/) · [Skills](https://mobie.sokpich.dev/skills/) · [Workflows](https://mobie.sokpich.dev/workflows/) · [Checklists](https://mobie.sokpich.dev/checklists/) · [Standards](https://mobie.sokpich.dev/standards/), plus full-text search across all of it

**The site's code is deliberately not in this repo.** It lives in a separate `mobie-site` repo
(VitePress) that clones this one at build time and points `srcDir` at the clone. Three things follow:
site routes mirror repo paths, so existing relative `.md` links keep working; this repo stays
agent-loadable content only, with no build tooling shipped into your project; and every page carries
an *Edit this page on GitHub* link back here. Pushing to `main` triggers a rebuild.

---

## The Agent Team

Each agent is a self-contained role: **purpose, responsibilities, hard rules, coding standards,
review checklist, common mistakes, and example tasks**. They're organized into four tiers that hand
off to each other (see [`AGENTS.md`](AGENTS.md)).

### Strategy

- [System Design Expert](agents/system_design_expert.md) — large-scale client/server & cross-cutting design
- [iOS Architect](agents/ios_architect.md) — module boundaries, layering, tech decisions (iOS)
- [Flutter Architect](agents/flutter_architect.md) — Flutter module boundaries, layering, package decisions (Flutter)

### Implementation

- [SwiftUI Expert](agents/swiftui_expert.md) — view composition, state, navigation (iOS)
- [UIKit Expert](agents/uikit_expert.md) — programmatic views, MVP contracts, presenters, navigation (iOS)
- [Flutter Expert](agents/flutter_expert.md) — widget composition, Riverpod state, go_router navigation (Flutter)
- [Networking Expert](agents/networking_expert.md) — REST/GraphQL clients, retries, error mapping
- [WebSocket Expert](agents/websocket_expert.md) — realtime transport, reconnection, backpressure
- [Backend Integrator](agents/backend_integrator.md) — API contracts, DTO mapping, pagination

### Quality & Hardening

- [Security Expert](agents/security_expert.md) — Keychain, pinning, crypto, OWASP MASVS
- [Testing Expert](agents/testing_expert.md) — unit/integration/UI strategy
- [Performance Expert](agents/performance_expert.md) — startup, memory, battery, rendering
- [Accessibility Expert](agents/accessibility_expert.md) — VoiceOver, Dynamic Type, contrast
- [Refactoring Expert](agents/refactoring_expert.md) — safe, incremental improvement

### Gate & Delivery

- [Code Reviewer](agents/code_reviewer.md) — correctness, concurrency, style, and risk gating (/review)
- [Release Manager](agents/release_manager.md) — versioning, signing, store submission
- [DevOps Expert](agents/devops_expert.md) — CI/CD, Fastlane, automation

---

## How to Use the Agents

There are only two ways to drive the toolkit, and you'll use the first one 95% of the time.

### Way 1 — Just describe the task (the default)

Talk to your agent in plain language. The entry file reads the request, routes it to the
right experts, and self-reviews — **you never name a file**:

```text
> Build an Account Summary screen that loads /accounts and stores the token securely.
```

### Way 2 — Name a file to steer it (for precision or to override routing)

Point the agent at a specific role, workflow, or checklist when you want exact control:

```text
> Read agents/security_expert.md and act as that agent, then audit Sources/Auth.
```

### What to type for common goals

| Your goal | Just say… | Or steer with… |
|-----------|-----------|----------------|
| Build a feature | "Build a profile screen that loads `/me`" | `workflows/create_feature.md` |
| Add / change an API | "Add the `/transactions` endpoint" | `workflows/integrate_rest_api.md` |
| Add auth / login | "Add OAuth login with secure token storage" | `agents/security_expert.md` |
| Review a diff | "Review my changes" | `checklists/code_review.md` |
| Fix something slow | "The feed scroll is janky, fix it" | `agents/performance_expert.md` |
| Write tests | "Write tests for `AuthRepository`" | `agents/testing_expert.md` |

> You don't need to know which agent owns a task — that's the toolkit's job. Naming a
> file (Way 2) is just how you override or sharpen the automatic routing.

### Per-tool syntax

The mental model above is identical in every tool; only the way you *reference a file*
changes. The examples below show the file-steer form (Way 2).

<details>
<summary><b>Claude Code</b></summary>

`CLAUDE.md` loads automatically. Pull in a specific role or workflow:

```text
> Read agents/security_expert.md and act as that agent.
> Audit Sources/Auth for credential issues using checklists/security_review.md.
> Follow workflows/integrate_rest_api.md to add the /transactions endpoint.
```

</details>

<details>
<summary><b>OpenAI Codex</b></summary>

`AGENTS.md` is read automatically. Reference files in your prompt:

```text
Using agents/swiftui_expert.md and standards/swiftui_standards.md, build the
account summary screen described below.
```

</details>

<details>
<summary><b>Cursor</b></summary>

`.cursorrules` applies automatically. Add a file to context and prompt:

```text
@workflows/integrate_graphql.md implement the feed query with pagination.
```

</details>

<details>
<summary><b>Windsurf</b></summary>

`.windsurfrules` is applied by Cascade. Reference files in chat:

```text
@checklists/code_review.md review the open diff.
```

</details>

<details>
<summary><b>Gemini CLI</b></summary>

`GEMINI.md` loads automatically. Use `@path` to include files:

```text
@agents/testing_expert.md @standards/testing_standards.md write tests for AuthRepository.
```

</details>

<details>
<summary><b>Aider</b></summary>

Add files to the chat session:

```bash
aider --read agents/ios_architect.md --read standards/architecture_standards.md
```

</details>

---

## How It Works

You describe a task; the toolkit handles the assignment. Every request goes through the same
four moves:

1. **Classify** — the entry file reads your request and identifies its *primary deliverable*
   (architecture, UI, data, security, a test, a release).
2. **Route** — it picks the one **entry agent** that owns that deliverable. You don't choose the
   agent; the request does.
3. **Chain** — that agent hands off down the tiers (Strategy → Implementation → Hardening →
   Gate), scaling the chain to the task: a one-line fix gets the specialist plus a review, a new
   feature runs the full sequence.
4. **Self-review** — the chain ends against the matching file in [`checklists/`](checklists/).

**What loads when.** Only the entry files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`,
`.cursorrules`, `.windsurfrules`) load at startup. Everything else — `agents/`, `skills/`,
`standards/`, `workflows/`, `checklists/` — is pulled in by the agent *as the task needs it*, so
context stays lean. Naming a file yourself just overrides or sharpens this automatic routing.

**Multi-platform by design.** The agent detects your project's platform (iOS, Android, Flutter,
React Native) and loads only that platform's subtree — `skills/<topic>/<platform>/` and
`templates/<platform>/` — plus the shared, platform-neutral layers (`standards/`,
`architecture/`, `checklists/`, `workflows/`). Within iOS, the agent also detects the UI paradigm
(`swiftui` or `uikit`) and loads only that paradigm's files (omitting the `ui:` key means content
applies to both); the paradigm axis is iOS-only. It never pulls another platform's code into context.

iOS is the most complete today. **Flutter ships a foundation pack** — architecture, Riverpod state,
go_router navigation, DI, repository, platform channels, networking, storage, security, testing, and
rendering performance — with [`standards/flutter_standards.md`](standards/flutter_standards.md) as
its package baseline and [`checklists/flutter_review.md`](checklists/flutter_review.md) as its review
gate. Android and React Native are still early; see
[Contributing](#contributing--everyone-is-welcome) to help port the rest.

> See [`AGENTS.md`](AGENTS.md) for the full routing table and the tier hierarchy, or the
> [Example Workflows](#example-workflows) diagram below for a real multi-agent handoff.

---

## Visualizing Agent Activity (Claude Code)

Watch the agents work in real time with [agents-observe](https://github.com/simple10/agents-observe) —
a local, open-source (MIT) observability dashboard. It captures Claude Code hook events into a
local SQLite database and streams them to a live web UI: tool calls, subagent hierarchy, session
replay, and token/cost stats. Nothing leaves your machine.

Setup (requires Docker and Node):

```bash
claude plugin marketplace add simple10/agents-observe
claude plugin install agents-observe
```

The plugin auto-starts its server on the next Claude Code session; the dashboard lives at
<http://localhost:4981>. Manage it from inside Claude Code with `/observe status`,
`/observe restart`, and `/observe logs`.

Each role in [`agents/`](agents/) is mirrored as a native Claude Code subagent in
[`.claude/agents/`](.claude/agents/) (e.g. `swiftui-expert`, `security-expert`), so when work is
delegated, every specialist appears as its own named agent in the dashboard instead of one
anonymous session.

---

## Example Workflows

Ready-made, end-to-end procedures — each with inputs, steps, validation, and acceptance criteria:

- **Build a feature end-to-end** — [`workflows/create_feature.md`](workflows/create_feature.md)
- **Integrate a REST API** — [`workflows/integrate_rest_api.md`](workflows/integrate_rest_api.md)
- **Add realtime with WebSockets** — [`workflows/integrate_websocket.md`](workflows/integrate_websocket.md)
- **Implement authentication** — [`workflows/implement_authentication.md`](workflows/implement_authentication.md)
- **Run a security audit** — [`workflows/perform_security_audit.md`](workflows/perform_security_audit.md)
- **Ship a release** — [`workflows/release_application.md`](workflows/release_application.md)

Behind the scenes, a non-trivial task flows through multiple agents:

```mermaid
flowchart LR
    R[Feature Request] --> A[Architect]
    A --> U[SwiftUI / UIKit / Flutter Expert]
    U --> N[Networking Expert]
    N --> S[Security Expert]
    S --> T[Testing Expert]
    T --> C[Code Reviewer]
    C --> Done([Merge-ready])
```

---

## Best Practices

1. **Load the smallest sufficient context** — the specific agent/skill/workflow, not the whole repo.
2. **Chain agents** for real work: architect → implementer → reviewer.
3. **Always end with a checklist** — have the agent self-review against [`checklists/`](checklists/).
4. **Treat standards as non-negotiable** — reference [`standards/`](standards/) for consistent output.
5. **Prefer workflows over ad-hoc prompts** for anything you'll do more than once.

---

## Design Principles

Every agent defaults to the same engineering values, so output looks like one team wrote it:

- **Clean Architecture + MVVM** and **SOLID** by default.
- **Security is a requirement, not an afterthought** (OWASP MASVS).
- **Testable, modular, observable** code with explicit, typed error handling.
- **Consistent standards** across sessions, tools, and contributors.

---

## Contributing — everyone is welcome

This is a **community toolkit**, and it gets sharper with every perspective. You do **not** need
to be an iOS engineer to help. Here's where people of every background fit in:

| If you're a… | You can help by… |
|--------------|------------------|
| **iOS / Swift dev** | Sharpening agents, skills, and standards; adding patterns you ship in production |
| **Android / Kotlin dev** | Porting iOS skills to Kotlin/Compose — Android parity is a top [roadmap](#roadmap) goal |
| **Flutter / cross-platform dev** | Adding Flutter, React Native, or KMP equivalents of existing skills and agents |
| **Backend / API dev** | Improving the networking, API-contract, and integration workflows |
| **Tester / QA** | Strengthening the testing agent, the checklists, and test-strategy skills |
| **Security reviewer** | Auditing the security standards and Keychain / crypto / pinning guidance |
| **Critic / reviewer** | Running the agents on real tasks and filing where the output falls short |
| **Writer / typo hunter** | Fixing typos, tightening wording, and improving clarity and examples |
| **Web dev** | Improving the [docs site](https://mobie.sokpich.dev) and landing page (open an issue — the site repo is separate) |
| **Designer** | Improving the diagrams, the logo / banner, and visual explanations |
| **Anyone** | Filing ideas and bug reports, starring, and sharing the repo |

Three ways in, smallest effort first — pick whichever fits:

1. **Spot something off?** [Open an issue](https://github.com/sokpichdev/mobile-engineering-agents/issues/new/choose)
   — a typo, a wrong recommendation, a missing topic, or just an idea.
2. **Have feedback on agent output?** Tell us what you asked, what you got, and what a senior
   engineer would have done instead — that's some of the most valuable input we receive.
3. **Want to write code or docs?** See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, section
   templates, and style, then send a PR.

### Good First Issues

New to the project? These are scoped, beginner-friendly, and have clear acceptance criteria —
the perfect place to start:

**[Browse `good first issue`s](https://github.com/sokpichdev/mobile-engineering-agents/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)**

Your first contribution in four steps:

1. **Pick an issue** from the list above and comment that you're taking it.
2. **Fork & branch** — `git checkout -b feat/<short-name>`.
3. **Make the change** following the [section templates](CONTRIBUTING.md#file-section-templates),
   then run `npm install && npm run lint`.
4. **Open a PR** with a [Conventional Commit](CONTRIBUTING.md#commit-convention) title
   (e.g. `feat(skills): add SwiftData storage skill`).

That's it — a maintainer will review and help you land it.

---

## Roadmap

- [x] Flutter foundation pack — agents, standards, checklist, templates, and the core skill set.
- [ ] Full Flutter parity (notifications, GraphQL, SSE, file upload, JWT, biometrics, crypto).
- [ ] Kotlin/Compose parity for the iOS-first skills.
- [ ] Machine-readable agent manifests (YAML front-matter) for automated routing.
- [ ] Expanded example apps with full test suites.
- [ ] Evaluations that score agent output against the checklists.
- [ ] Optional MCP server exposing skills as callable tools.

---

## License

[MIT](LICENSE) © Sok Pich — free to use, fork, and adapt.

<div align="center">

**If this makes your AI a better mobile engineer, give it a ⭐ and share it.**

</div>
