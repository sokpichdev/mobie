#!/usr/bin/env node
// mobie — install the Mobile Engineering Agents toolkit into a project.
// Zero dependencies on purpose: `npx @sok_pich/mobie` should start fast and pull in nothing else.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const PKG_ROOT = path.resolve(__dirname, '..');
const PKG = require('../package.json');

// What users type to run us, e.g. `npx @sok_pich/mobie init`.
const NPX = `npx ${PKG.name}`;
const NPX_LATEST = `npx ${PKG.name}@latest`;

const TOOLKIT_DIR = '.mobile-agents';
const MANIFEST = `${TOOLKIT_DIR}/.mobie-manifest.json`;
const CONTENT_DIRS = ['agents', 'skills', 'standards', 'workflows', 'templates', 'checklists', 'architecture', 'prompts'];
const ROOT_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'GLOSSARY.md', '.cursorrules', '.windsurfrules', 'README.md', 'LICENSE'];
const PLATFORMS = ['ios', 'flutter', 'android', 'react_native'];
const TOOLS = ['claude', 'cursor', 'windsurf', 'codex', 'gemini'];
const TOOL_ALIASES = { gpt: 'codex', openai: 'codex', chatgpt: 'codex' };
const IGNORED_NAMES = new Set(['.DS_Store']);

// The only folders mobie writes files into. Manifest paths outside them are rejected.
const MANAGED_ROOTS = [TOOLKIT_DIR, '.claude/agents', '.claude/commands'];
const isManagedPath = (rel) => MANAGED_ROOTS.some((root) => rel.startsWith(`${root}/`));

const BLOCK_START = '<!-- mobie:start';
const BLOCK_END = '<!-- mobie:end -->';

// Entry file each tool reads at session start, and how it should reach the toolkit.
const ENTRY_FILES = {
  claude: { file: 'CLAUDE.md', load: `@${TOOLKIT_DIR}/CLAUDE.md` },
  cursor: { file: '.cursorrules', load: `@${TOOLKIT_DIR}/.cursorrules` },
  windsurf: { file: '.windsurfrules', load: `@${TOOLKIT_DIR}/.windsurfrules` },
  gemini: { file: 'GEMINI.md', load: `@${TOOLKIT_DIR}/GEMINI.md` },
  codex: { file: 'AGENTS.md', load: `Read \`${TOOLKIT_DIR}/AGENTS.md\` at session start and follow it.` },
};

// With --local, mobie never edits an entry file that already exists (it may be shared with the
// team). Claude Code has a personal alternative; the other tools are left unwired instead.
const LOCAL_ENTRY_FILES = { claude: 'CLAUDE.local.md' };

const EXCLUDE_START = '# mobie:start';
const EXCLUDE_END = '# mobie:end';

// Subagents that only make sense on one platform; everything else is shared.
const PLATFORM_AGENTS = {
  ios: ['ios-architect', 'swiftui-expert', 'uikit-expert'],
  flutter: ['flutter-architect', 'flutter-expert'],
};

// ---------------------------------------------------------------------------
// Output

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const green = paint('32');
const yellow = paint('33');
const red = paint('31');
const dim = paint('2');
const bold = paint('1');

const log = (...a) => console.log(...a);

class UsageError extends Error {}

// ---------------------------------------------------------------------------
// Helpers

const toPosix = (p) => p.split(path.sep).join('/');
// Hashes ignore CRLF vs LF, so a Windows checkout (core.autocrlf) doesn't look locally edited.
const sha256 = (buf) => crypto.createHash('sha256').update(buf.toString('utf8').replace(/\r\n/g, '\n')).digest('hex');

function readIfExists(file) {
  try {
    return fs.readFileSync(file);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    if (err.code === 'EISDIR') throw new UsageError(`Expected a file but found a directory: ${file}`);
    throw err;
  }
}

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_NAMES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) out.push(toPosix(path.relative(base, full)));
  }
  return out;
}

function writeFile(projectDir, rel, content) {
  const dest = path.join(projectDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}

// Removes a toolkit file, then any parent folders it leaves empty — but never a managed root
// itself, and never anything outside one (the user's own empty `.claude/hooks/` stays).
function removeFile(projectDir, rel) {
  fs.rmSync(path.join(projectDir, rel));
  for (let dir = path.posix.dirname(rel); !MANAGED_ROOTS.includes(dir) && isManagedPath(`${dir}/`); dir = path.posix.dirname(dir)) {
    const full = path.join(projectDir, dir);
    if (fs.readdirSync(full).length) break;
    fs.rmdirSync(full);
  }
}

// ---------------------------------------------------------------------------
// Detection

function detectPlatform(projectDir) {
  const names = fs.readdirSync(projectDir);
  const has = (name) => names.includes(name);
  const hasExt = (ext) => names.some((n) => n.endsWith(ext));

  if (has('pubspec.yaml')) return 'flutter';
  if (has('package.json')) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'));
      if ({ ...pkg.dependencies, ...pkg.devDependencies }['react-native']) return 'react_native';
    } catch {
      // Unreadable package.json — fall through to the other signals.
    }
  }
  if (has('Package.swift') || has('Podfile') || has('project.yml') || hasExt('.xcodeproj') || hasExt('.xcworkspace')) {
    return 'ios';
  }
  if (['build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts'].some(has)) return 'android';
  return null;
}

function detectTools(projectDir) {
  const exists = (p) => fs.existsSync(path.join(projectDir, p));
  const tools = new Set(['claude']);
  if (exists('.cursorrules') || exists('.cursor')) tools.add('cursor');
  if (exists('.windsurfrules') || exists('.windsurf')) tools.add('windsurf');
  if (exists('GEMINI.md') || exists('.gemini')) tools.add('gemini');
  if (exists('AGENTS.md') || exists('.codex')) tools.add('codex');
  return [...tools];
}

// ---------------------------------------------------------------------------
// Plan: every file the toolkit should own in the project, keyed by project-relative path.

// Drops `skills/<topic>/<other-platform>/…` and `templates/<other-platform>/…`.
function isForPlatform(rel, platform) {
  if (platform === 'all') return true;
  const parts = rel.split('/');
  const platformSegment = parts[0] === 'skills' ? parts[2] : parts[0] === 'templates' ? parts[1] : null;
  return !PLATFORMS.includes(platformSegment) || platformSegment === platform;
}

function isAgentForPlatform(name, platform) {
  if (!PLATFORM_AGENTS[platform]) return true;
  const owner = Object.keys(PLATFORM_AGENTS).find((p) => PLATFORM_AGENTS[p].includes(name));
  return !owner || owner === platform;
}

// Claude Code only discovers `.claude/` at the project root, so subagents and commands are
// copied there — and their repo-relative references are re-pointed into the toolkit folder.
const TOOLKIT_REF = new RegExp(
  '(`|\\]\\()((?:\\.\\./)*)((?:' + CONTENT_DIRS.join('|') + ')/[^`)\\s]*|AGENTS\\.md|GLOSSARY\\.md)',
  'g',
);

function rewriteToolkitRefs(text) {
  return text.replace(TOOLKIT_REF, (_, open, ups, ref) => `${open}${ups}${TOOLKIT_DIR}/${ref}`);
}

function buildPlan({ platform, tools }) {
  const plan = new Map();

  for (const file of ROOT_FILES) {
    plan.set(`${TOOLKIT_DIR}/${file}`, fs.readFileSync(path.join(PKG_ROOT, file)));
  }
  for (const dir of CONTENT_DIRS) {
    for (const rel of walk(path.join(PKG_ROOT, dir))) {
      const full = `${dir}/${rel}`;
      if (isForPlatform(full, platform)) plan.set(`${TOOLKIT_DIR}/${full}`, fs.readFileSync(path.join(PKG_ROOT, full)));
    }
  }

  if (tools.includes('claude')) {
    for (const kind of ['agents', 'commands']) {
      const src = path.join(PKG_ROOT, '.claude', kind);
      for (const rel of walk(src)) {
        if (kind === 'agents' && !isAgentForPlatform(path.basename(rel, '.md'), platform)) continue;
        const text = fs.readFileSync(path.join(src, rel), 'utf8');
        plan.set(`.claude/${kind}/${rel}`, Buffer.from(rewriteToolkitRefs(text)));
      }
    }
  }
  return plan;
}

// ---------------------------------------------------------------------------
// Entry files: a marker-delimited block we own inside a file the user also owns.

function entryBlock(tool, platform) {
  return [
    `${BLOCK_START} — managed by mobie (\`${NPX}\`); edits inside this block are overwritten -->`,
    ENTRY_FILES[tool].load,
    '',
    `The Mobile Engineering Agents toolkit is installed in \`${TOOLKIT_DIR}/\` (platform: ${platform}).`,
    'Toolkit paths such as `AGENTS.md`, `agents/`, `skills/`, `standards/`, `workflows/`,',
    `\`templates/\`, \`checklists/\` and \`architecture/\` are relative to \`${TOOLKIT_DIR}/\`.`,
    BLOCK_END,
  ].join('\n');
}

const countOf = (text, needle) => text.split(needle).length - 1;

// Returns the new file content, or null when the markers are damaged (a start without its end,
// or several blocks) — guessing the block's extent there could delete the user's own text.
function upsertBlock(existing, block, startMarker = BLOCK_START, endMarker = BLOCK_END) {
  if (existing === null) return `${block}\n`;
  const starts = countOf(existing, startMarker);
  const ends = countOf(existing, endMarker);
  if (starts === 0 && ends === 0) return `${existing.replace(/\s*$/, '')}\n\n${block}\n`;
  const start = existing.indexOf(startMarker);
  const end = existing.indexOf(endMarker);
  if (starts !== 1 || ends !== 1 || end < start) return null;
  return existing.slice(0, start) + block + existing.slice(end + endMarker.length);
}

// Inverse of upsertBlock: the content without our block, or null when there's no intact block.
function removeBlock(existing, startMarker = BLOCK_START, endMarker = BLOCK_END) {
  if (countOf(existing, startMarker) !== 1 || countOf(existing, endMarker) !== 1) return null;
  const start = existing.indexOf(startMarker);
  const end = existing.indexOf(endMarker) + endMarker.length;
  if (end < start) return null;
  const rest = `${existing.slice(0, start).replace(/\s*$/, '')}\n\n${existing.slice(end).replace(/^\s*/, '')}`;
  return rest.trim() ? `${rest.trim()}\n` : '';
}

// ---------------------------------------------------------------------------
// Local installs: keep everything mobie writes out of git via .git/info/exclude, which is
// per-clone and never committed.

function git(projectDir, args) {
  return execFileSync('git', args, { cwd: projectDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function gitExclude(projectDir) {
  try {
    // Exclude patterns are relative to the repo root, which may sit above the project directory.
    return { file: path.resolve(projectDir, git(projectDir, ['rev-parse', '--git-path', 'info/exclude'])), prefix: git(projectDir, ['rev-parse', '--show-prefix']) };
  } catch {
    return null;
  }
}

function isGitIgnored(projectDir, rel) {
  try {
    git(projectDir, ['check-ignore', '-q', '--', rel]);
    return true;
  } catch {
    return false;
  }
}

// Paths among `rels` that git tracks (ignore rules can't hide those).
function trackedPaths(projectDir, rels) {
  if (!rels.length) return [];
  const out = git(projectDir, ['ls-files', '-z', '--full-name', '--', ...rels]);
  const prefix = git(projectDir, ['rev-parse', '--show-prefix']);
  return out.split('\0').filter(Boolean).map((p) => p.slice(prefix.length));
}

// One block per install, keyed by its directory: monorepo subprojects and linked worktrees
// share one exclude file, and must not overwrite or remove each other's blocks.
const excludeMarkers = (projectDir) => {
  const key = toPosix(fs.realpathSync(projectDir));
  return [`${EXCLUDE_START} [${key}]`, `${EXCLUDE_END} [${key}]`];
};

// Escapes gitignore metacharacters so a folder like `app[1]` is matched literally.
const gitPattern = (p) => p.replace(/[[\]*?\\]/g, '\\$&').replace(/ $/, '\\ ');

function excludeBlock([start, end], prefix, paths) {
  return [
    `${start} — local install, managed by mobie; edits inside this block are overwritten`,
    ...paths.map((p) => `/${gitPattern(prefix + p)}`),
    end,
  ].join('\n');
}

// True for a missing file, or one holding nothing but our block (i.e. mobie created it).
function isOnlyOurBlock(content) {
  return content === null || removeBlock(content.toString('utf8')) === '';
}

// Which file each tool's block lives in. In local mode a git-tracked file is the team's and is
// never edited, and Claude always uses its personal CLAUDE.local.md: a CLAUDE.md that git
// ignores would be silently replaced by `git pull` once a teammate commits one.
function resolveEntryFiles(projectDir, tools, local) {
  const entries = {};
  for (const tool of tools) {
    const shared = ENTRY_FILES[tool].file;
    if (!local) entries[tool] = shared;
    else if (LOCAL_ENTRY_FILES[tool]) entries[tool] = LOCAL_ENTRY_FILES[tool];
    else if (!trackedPaths(projectDir, [shared]).length && isOnlyOurBlock(readIfExists(path.join(projectDir, shared)))) entries[tool] = shared;
    else entries[tool] = null;
  }
  return entries;
}

const previousEntries = (previous) =>
  previous.entries || Object.fromEntries(previous.tools.map((t) => [t, ENTRY_FILES[t].file]));

// ---------------------------------------------------------------------------
// Manifest

// The manifest is committed, so treat it as untrusted: its paths drive writes and deletes.
function readManifest(projectDir) {
  const raw = readIfExists(path.join(projectDir, MANIFEST));
  if (!raw) return null;
  const invalid = (why) => new UsageError(`${MANIFEST} is invalid (${why}). Fix it or delete it and run \`${NPX} init\`.`);
  let manifest;
  try {
    manifest = JSON.parse(raw.toString('utf8'));
  } catch {
    throw invalid('not valid JSON');
  }
  if (!manifest || !manifest.files || typeof manifest.files !== 'object' || !Array.isArray(manifest.tools)) throw invalid('missing fields');
  if (![...PLATFORMS, 'all'].includes(manifest.platform)) throw invalid(`unknown platform "${manifest.platform}"`);
  const badTool = manifest.tools.find((t) => !TOOLS.includes(t));
  if (badTool !== undefined) throw invalid(`unknown tool "${badTool}"`);
  if (manifest.local !== undefined && typeof manifest.local !== 'boolean') throw invalid('"local" must be true or false');
  for (const [tool, file] of Object.entries(manifest.entries || {})) {
    const allowed = TOOLS.includes(tool) && (file === null || file === ENTRY_FILES[tool].file || file === LOCAL_ENTRY_FILES[tool]);
    if (!allowed) throw invalid(`unexpected entry file for "${tool}"`);
  }
  for (const [rel, hash] of Object.entries(manifest.files)) {
    const safe = path.posix.normalize(rel) === rel && !rel.split('/').includes('..') && isManagedPath(rel);
    if (!safe) throw invalid(`path outside the toolkit folders: "${rel}"`);
    if (!/^[0-9a-f]{64}$/.test(hash)) throw invalid(`bad hash for "${rel}"`);
  }
  return manifest;
}

// ---------------------------------------------------------------------------
// Install / update

function install(projectDir, { platform, tools, local, force, dryRun, gitignore }, previous) {
  const plan = buildPlan({ platform, tools });
  const oldFiles = previous ? previous.files : {};
  const files = {};
  const result = { added: [], updated: [], unchanged: [], skipped: [], removed: [], kept: [], entries: [], blocked: [], unwired: [], notes: [] };

  // Resolve git first, so a --local install that can't work fails before writing anything.
  const exclude = local || (previous && previous.local) ? gitExclude(projectDir) : null;
  if (local && !exclude) throw new UsageError('--local needs a git repository: it hides the toolkit with .git/info/exclude.');
  if (local) {
    const ours = [TOOLKIT_DIR, ...Object.keys(oldFiles).filter((r) => r.startsWith('.claude/'))];
    const tracked = trackedPaths(projectDir, ours);
    if (tracked.length) {
      const shown = tracked.slice(0, 3).join(', ') + (tracked.length > 3 ? `, … (${tracked.length} files)` : '');
      throw new UsageError(
        `--local can't hide files that are committed to git: ${shown}.\n` +
          `Untrack them first (they stay on disk): git rm -r --cached -- ${TOOLKIT_DIR} ${ours.slice(1).join(' ')}`.trim() +
          ', commit, then run this again.',
      );
    }
  }
  const write = (rel, content) => !dryRun && writeFile(projectDir, rel, content);

  for (const [rel, content] of plan) {
    const hash = sha256(content);
    const current = readIfExists(path.join(projectDir, rel));
    const currentHash = current && sha256(current);

    if (current === null) {
      write(rel, content);
      result.added.push(rel);
      files[rel] = hash;
    } else if (currentHash === hash) {
      result.unchanged.push(rel);
      files[rel] = hash;
    } else if (currentHash === oldFiles[rel] || force) {
      // Pristine since our last install (or the user asked us to overwrite).
      write(rel, content);
      result.updated.push(rel);
      files[rel] = hash;
    } else {
      // Edited by the user, or a file we never owned: leave it alone.
      result.skipped.push(rel);
      if (oldFiles[rel]) files[rel] = oldFiles[rel];
    }
  }

  for (const [rel, oldHash] of Object.entries(oldFiles)) {
    if (plan.has(rel)) continue;
    const current = readIfExists(path.join(projectDir, rel));
    if (current === null) continue;
    // Never delete a file the user edited, even with --force — it may be their only copy.
    if (sha256(current) === oldHash) {
      if (!dryRun) removeFile(projectDir, rel);
      result.removed.push(rel);
    } else {
      result.kept.push(rel);
    }
  }

  const entries = resolveEntryFiles(projectDir, tools, local);

  // A block left behind in a file we no longer use (tool dropped, or --local switched) is removed.
  if (previous) {
    for (const [tool, file] of Object.entries(previousEntries(previous))) {
      if (!file || entries[tool] === file) continue;
      if (local && trackedPaths(projectDir, [file]).length) {
        result.notes.push(`${file} is committed to git, so its mobie block was left in place — remove it there if the team agrees`);
        continue;
      }
      const existing = readIfExists(path.join(projectDir, file));
      const after = existing && removeBlock(existing.toString('utf8'));
      if (after === null || after === undefined) continue;
      if (!dryRun) {
        if (after) writeFile(projectDir, file, after);
        else fs.rmSync(path.join(projectDir, file));
      }
      result.entries.push(`${file} (unwired)`);
    }
  }

  for (const tool of tools) {
    const file = entries[tool];
    if (!file) {
      result.unwired.push(tool);
      continue;
    }
    const existing = readIfExists(path.join(projectDir, file));
    const before = existing && existing.toString('utf8');
    const after = upsertBlock(before, entryBlock(tool, platform));
    if (after === null) {
      result.blocked.push(file);
    } else if (after !== before) {
      write(file, after);
      result.entries.push(file);
    }
  }

  if (!local && previous && previous.local && !exclude) {
    result.notes.push('git could not be run, so the mobie block in .git/info/exclude was left in place');
  }
  if (exclude) {
    const excludeFile = exclude.file;
    const markers = excludeMarkers(projectDir);
    const existing = readIfExists(excludeFile);
    const before = existing && existing.toString('utf8');
    let after;
    if (local) {
      const claudeFiles = [...Object.keys(files), ...result.kept].filter((r) => r.startsWith('.claude/'));
      const hidden = [`${TOOLKIT_DIR}/`, ...claudeFiles, ...Object.values(entries).filter(Boolean)];
      after = upsertBlock(before, excludeBlock(markers, exclude.prefix, [...new Set(hidden)]), ...markers);
    } else {
      after = before === null ? undefined : before.includes(markers[0]) || before.includes(markers[1]) ? removeBlock(before, ...markers) : undefined;
    }
    const label = toPosix(path.relative(projectDir, excludeFile));
    if (after === null) result.blocked.push(label);
    else if (after !== undefined && after !== before) {
      if (!dryRun) {
        fs.mkdirSync(path.dirname(excludeFile), { recursive: true });
        fs.writeFileSync(excludeFile, after);
      }
      result.entries.push(label);
    }
  }

  if (gitignore) {
    const ignorePath = path.join(projectDir, '.gitignore');
    const existing = (readIfExists(ignorePath) || '').toString('utf8');
    const hasEntry = existing.split(/\r?\n/).some((l) => l.trim().replace(/\/$/, '') === TOOLKIT_DIR);
    if (!hasEntry) {
      const prefix = existing && !existing.endsWith('\n') ? '\n' : '';
      write('.gitignore', `${existing}${prefix}${TOOLKIT_DIR}/\n`);
      result.entries.push('.gitignore');
    }
  }

  if (!dryRun) {
    const manifest = { version: PKG.version, platform, tools, local, entries, files: sortKeys(files) };
    writeFile(projectDir, MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  return result;
}

function sortKeys(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
}

function report(result, { dryRun, verbose }) {
  const prefix = dryRun ? dim('[dry run] ') : '';
  const line = (label, list, color) => {
    if (!list.length) return;
    log(`${prefix}${color(label.padEnd(10))} ${list.length}`);
    if (verbose || list.length <= 5) for (const rel of list) log(dim(`             ${rel}`));
  };
  line('added', result.added, green);
  line('updated', result.updated, green);
  line('removed', result.removed, green);
  line('unchanged', result.unchanged, dim);
  line('entry', result.entries, green);
  if (result.skipped.length) {
    log(`${prefix}${yellow('skipped'.padEnd(10))} ${result.skipped.length} ${dim('(edited locally or not created by mobie)')}`);
    for (const rel of result.skipped) log(yellow(`             ${rel}`));
  }
  if (result.skipped.length) log(dim('Re-run with --force to overwrite them with the toolkit version.'));
  if (result.kept.length) {
    log(`${prefix}${yellow('kept'.padEnd(10))} ${result.kept.length} ${dim('(no longer shipped, but edited locally — delete them yourself if unused)')}`);
    for (const rel of result.kept) log(yellow(`             ${rel}`));
  }
  for (const note of result.notes) log(`${prefix}${yellow('note'.padEnd(10))} ${note}`);
  if (result.unwired.length) {
    log(`${prefix}${yellow('not wired'.padEnd(10))} ${result.unwired.join(', ')} ${dim('(--local never edits an entry file that already exists)')}`);
    for (const tool of result.unwired) {
      log(dim(`             add ${ENTRY_FILES[tool].load.startsWith('@') ? `"${ENTRY_FILES[tool].load}"` : 'a pointer to .mobile-agents/AGENTS.md'} to ${ENTRY_FILES[tool].file} yourself if you want it`));
    }
  }
  if (result.blocked.length) {
    log(`${prefix}${red('not wired'.padEnd(10))} ${result.blocked.length} ${dim('(damaged mobie block markers — left untouched)')}`);
    for (const rel of result.blocked) log(red(`             ${rel}`));
    log(dim(`Fix the ${BLOCK_START} … ${BLOCK_END} markers by hand (one of each), then run \`${NPX} update\`.`));
  }
}

// ---------------------------------------------------------------------------
// Interactive tool picker (only when a human is at a terminal)

const TOOL_CHOICES = [
  { id: 'claude', label: 'Claude Code', hint: 'CLAUDE.md + .claude/ subagents' },
  { id: 'codex', label: 'Codex / ChatGPT (OpenAI)', hint: 'AGENTS.md' },
  { id: 'gemini', label: 'Gemini CLI', hint: 'GEMINI.md' },
  { id: 'cursor', label: 'Cursor', hint: '.cursorrules' },
  { id: 'windsurf', label: 'Windsurf', hint: '.windsurfrules' },
];

// Pure key handling, kept separate from the terminal I/O so it can be tested.
function pickerReduce(state, key) {
  const { cursor, selected } = state;
  const toggle = (id) => (selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  switch (key) {
    case 'up': case 'k': return { ...state, cursor: (cursor - 1 + TOOL_CHOICES.length) % TOOL_CHOICES.length, error: null };
    case 'down': case 'j': return { ...state, cursor: (cursor + 1) % TOOL_CHOICES.length, error: null };
    case 'space': return { ...state, selected: toggle(TOOL_CHOICES[cursor].id), error: null };
    case 'a': {
      const all = selected.length === TOOL_CHOICES.length;
      return { ...state, selected: all ? [] : TOOL_CHOICES.map((c) => c.id), error: null };
    }
    case 'return':
      if (!selected.length) return { ...state, error: 'Select at least one tool (space to toggle).' };
      return { ...state, done: true };
    default: return state;
  }
}

function renderPicker(state) {
  const lines = [`${bold('Which AI coding tools do you use?')} ${dim('↑/↓ move · space select · a all · enter confirm')}`];
  TOOL_CHOICES.forEach((choice, i) => {
    const pointer = i === state.cursor ? '❯' : ' ';
    const box = state.selected.includes(choice.id) ? green('◉') : '◯';
    lines.push(`${pointer} ${box} ${choice.label} ${dim(`— ${choice.hint}`)}`);
  });
  lines.push(state.error ? yellow(state.error) : '');
  return lines;
}

function promptTools(preselected) {
  const { stdin, stdout } = process;
  const readline = require('node:readline');
  return new Promise((resolve) => {
    let state = { cursor: 0, selected: TOOL_CHOICES.map((c) => c.id).filter((id) => preselected.includes(id)), error: null };
    let drawn = 0;
    const draw = () => {
      if (drawn) stdout.write(`\x1b[${drawn}A\x1b[J`);
      const lines = renderPicker(state);
      stdout.write(`${lines.join('\n')}\n`);
      drawn = lines.length;
    };
    const finish = () => {
      stdin.removeListener('keypress', onKey);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\x1b[?25h');
    };
    const onKey = (str, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        finish();
        stdout.write('\n');
        process.exit(130);
      }
      state = pickerReduce(state, key.name || str);
      if (state.done) {
        finish();
        stdout.write(`\x1b[${drawn}A\x1b[J`);
        const labels = TOOL_CHOICES.filter((c) => state.selected.includes(c.id)).map((c) => c.label);
        log(`${green('✓')} Tools: ${bold(labels.join(', '))}`);
        resolve(TOOL_CHOICES.map((c) => c.id).filter((id) => state.selected.includes(id)));
      } else {
        draw();
      }
    };
    readline.emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    stdout.write('\x1b[?25l');
    stdin.on('keypress', onKey);
    draw();
  });
}

const canPrompt = (opts) => !opts.yes && process.stdin.isTTY && process.stdout.isTTY && !process.env.CI;

// ---------------------------------------------------------------------------
// Commands

// --local / --no-local win; otherwise keep whatever the existing install uses.
function resolveLocal(opts, previous) {
  const local = opts.local !== undefined ? opts.local : Boolean(previous && previous.local);
  if (local && opts.gitignore) throw new UsageError('--local and --gitignore conflict: --local already hides everything from git.');
  return local;
}

async function cmdInit(projectDir, opts) {
  const previous = readManifest(projectDir);
  // Re-running init keeps the existing choices; only explicit flags change them.
  let platform = opts.platform || (previous && previous.platform);
  if (!platform) {
    platform = detectPlatform(projectDir);
    if (platform) log(`Detected platform: ${bold(platform)}`);
    else {
      platform = 'ios';
      log(`No platform markers found — defaulting to ${bold('ios')} ${dim('(override with --platform)')}`);
    }
  } else {
    log(`Platform: ${bold(platform)}`);
  }
  if (platform === 'react_native' || platform === 'android') {
    log(yellow(`Note: ${platform} has little platform-specific content yet; installing the shared toolkit.`));
  }
  let tools = opts.tools || (previous && previous.tools);
  if (!tools) {
    const detected = detectTools(projectDir);
    if (canPrompt(opts)) tools = await promptTools(detected);
    else {
      tools = detected;
      log(`Tools: ${bold(tools.join(', '))} ${dim('(pick others with --tool)')}`);
    }
  } else {
    log(`Tools: ${bold(tools.join(', '))}`);
  }
  if (previous) log(dim(`Existing install found (v${previous.version}) — updating it.`));
  const local = resolveLocal(opts, previous);
  if (local) log(`Mode: ${bold('local')} ${dim('(kept out of git via .git/info/exclude)')}`);

  const result = install(projectDir, { ...opts, platform, tools, local }, previous);
  report(result, opts);
  if (!opts.dryRun) {
    log('');
    log(green(`✓ mobie v${PKG.version} installed in ${TOOLKIT_DIR}/`));
    if (local) log('Git ignores everything mobie added, on this machine only — nothing to commit.');
    else log(`Commit ${TOOLKIT_DIR}/ and .claude/ so teammates get the same setup.`);
    log(`Start a session and look for: ${bold('Mobile Engineering Agents — loaded ✓')}`);
  }
}

function cmdUpdate(projectDir, opts) {
  const previous = readManifest(projectDir);
  if (!previous) throw new UsageError(`No ${MANIFEST} found. Run \`${NPX} init\` first.`);
  const platform = opts.platform || previous.platform;
  const tools = opts.tools || previous.tools;
  const local = resolveLocal(opts, previous);
  log(`Updating v${previous.version} → v${PKG.version} (platform: ${bold(platform)}, tools: ${bold(tools.join(', '))}${local ? ', local' : ''})`);
  if (PKG.version === previous.version) log(dim(`Same version — tip: run \`${NPX_LATEST} update\` for the newest release.`));

  const result = install(projectDir, { ...opts, platform, tools, local }, previous);
  report(result, opts);
  if (!opts.dryRun) log(green(`\n✓ Up to date with mobie v${PKG.version}`));
}

function cmdDoctor(projectDir) {
  let errors = 0;
  let warnings = 0;
  const ok = (msg) => log(`  ${green('✓')} ${msg}`);
  const warn = (msg) => (warnings++, log(`  ${yellow('!')} ${msg}`));
  const fail = (msg) => (errors++, log(`  ${red('✗')} ${msg}`));

  log(bold('mobie doctor'));
  const manifest = readManifest(projectDir);
  if (!manifest) {
    fail(`${MANIFEST} not found — run \`${NPX} init\``);
    return 1;
  }
  ok(`installed v${manifest.version} (platform: ${manifest.platform}, tools: ${manifest.tools.join(', ')})`);
  if (manifest.version !== PKG.version) warn(`this CLI is v${PKG.version} — run \`${NPX_LATEST} update\``);

  let missing = 0;
  const modified = [];
  for (const [rel, hash] of Object.entries(manifest.files)) {
    const current = readIfExists(path.join(projectDir, rel));
    if (current === null) missing++;
    else if (sha256(current) !== hash) modified.push(rel);
  }
  const total = Object.keys(manifest.files).length;
  if (missing) fail(`${missing} of ${total} toolkit files are missing — run \`${NPX} update\``);
  else ok(`${total} toolkit files present`);
  if (modified.length) warn(`${modified.length} file(s) edited locally (update will leave them alone): ${modified.join(', ')}`);

  const entries = manifest.entries || previousEntries(manifest);
  for (const tool of manifest.tools) {
    const file = entries[tool];
    if (!file) {
      warn(`${tool}: not wired — ${ENTRY_FILES[tool].file} already existed, and --local doesn't edit it`);
      continue;
    }
    const content = readIfExists(path.join(projectDir, file));
    const text = content ? content.toString('utf8') : '';
    const markers = [countOf(text, BLOCK_START), countOf(text, BLOCK_END)];
    if (markers[0] === 1 && markers[1] === 1 && text.indexOf(BLOCK_START) < text.indexOf(BLOCK_END)) ok(`${tool}: ${file} loads the toolkit`);
    else if (markers[0] || markers[1]) fail(`${tool}: ${file} has damaged mobie markers — keep exactly one start and one end`);
    else fail(`${tool}: ${file} has no mobie block — run \`${NPX} update\``);
  }

  if (manifest.tools.includes('claude')) {
    const broken = [];
    const refPattern = new RegExp('`(' + TOOLKIT_DIR.replace('.', '\\.') + '/[^`\\s]+)`', 'g');
    for (const rel of Object.keys(manifest.files).filter((r) => r.startsWith('.claude/'))) {
      const content = readIfExists(path.join(projectDir, rel));
      if (!content) continue;
      for (const [, ref] of content.toString('utf8').matchAll(refPattern)) {
        if (!fs.existsSync(path.join(projectDir, ref))) broken.push(`${rel} → ${ref}`);
      }
    }
    if (broken.length) for (const b of broken) fail(`broken reference: ${b}`);
    else ok('Claude subagents and commands resolve into the toolkit');

    const ignore = readIfExists(path.join(projectDir, '.gitignore'));
    const ignored = ignore && ignore.toString('utf8').split(/\r?\n/).some((l) => l.trim().replace(/\/$/, '') === TOOLKIT_DIR);
    if (ignored && !manifest.local) warn(`${TOOLKIT_DIR}/ is gitignored — teammates' .claude/ subagents will point at missing files`);
  }

  if (manifest.local && !gitExclude(projectDir)) {
    warn('local install, but git could not be run here to check that everything is ignored');
  } else if (manifest.local) {
    const visible = [`${TOOLKIT_DIR}/AGENTS.md`, ...Object.keys(manifest.files).filter((r) => r.startsWith('.claude/')), ...Object.values(entries).filter(Boolean)]
      .filter((rel) => fs.existsSync(path.join(projectDir, rel)) && !isGitIgnored(projectDir, rel));
    if (visible.length) fail(`local install, but git can see: ${visible.join(', ')} — run \`${NPX} update\` (tracked files need \`git rm --cached\`)`);
    else ok('local install: git ignores everything mobie added');
  }

  log('');
  if (errors) log(red(`${errors} problem(s) found.`));
  else log(green(warnings ? `Healthy, with ${warnings} warning(s).` : 'All good.'));
  return errors ? 1 : 0;
}

// ---------------------------------------------------------------------------
// CLI

const HELP = `${bold('mobie')} v${PKG.version} — Mobile Engineering Agents for your AI coding tool

Usage
  ${NPX} init      Install the toolkit into the current project
  ${NPX} update    Update an existing install, keeping your local edits
  ${NPX} doctor    Check that the install is wired up correctly

Options
  --platform <p>      ${PLATFORMS.join(' | ')} | all   (default: detected, else ios)
  --tool <list>       comma-separated: ${TOOLS.join(', ')}, or all
                      (default: ask in a terminal; otherwise claude + any tool already configured)
                      codex = OpenAI Codex / ChatGPT, which read AGENTS.md
  -y, --yes           don't ask; use the detected tools
  --dir <path>        project directory (default: current directory)
  --force             overwrite files you edited locally (never deletes them)
  --dry-run           show what would change without writing anything
  --local             keep the install out of git on this machine only (.git/info/exclude);
                      never edits tracked files — Claude Code uses CLAUDE.local.md
  --no-local          switch a local install back to a shared, committable one
  --gitignore         add ${TOOLKIT_DIR}/ to .gitignore (not recommended for teams)
  --verbose           list every file
  -v, --version       print the version
  -h, --help          show this help
`;

function parseArgs(argv) {
  const opts = { command: null, dir: process.cwd() };
  const takeValue = (i, flag) => {
    const value = argv[i + 1];
    if (!value || value.startsWith('-')) throw new UsageError(`${flag} needs a value`);
    return value;
  };
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i];
    let inline;
    if (arg.startsWith('--') && arg.includes('=')) [arg, inline] = [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)];
    const value = () => (inline !== undefined ? inline : takeValue(i++, arg));
    switch (arg) {
      case '-h': case '--help': opts.help = true; break;
      case '-v': case '--version': opts.version = true; break;
      case '--force': opts.force = true; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--gitignore': opts.gitignore = true; break;
      case '--local': opts.local = true; break;
      case '--no-local': opts.local = false; break;
      case '--verbose': opts.verbose = true; break;
      case '-y': case '--yes': opts.yes = true; break;
      case '--dir': {
        const dir = value();
        if (!dir) throw new UsageError('--dir needs a value');
        opts.dir = path.resolve(dir);
        break;
      }
      case '--platform': {
        const p = value();
        if (![...PLATFORMS, 'all'].includes(p)) throw new UsageError(`Unknown platform "${p}". Use one of: ${PLATFORMS.join(', ')}, all`);
        opts.platform = p;
        break;
      }
      case '--tool': case '--tools': {
        const list = value().split(',').map((t) => TOOL_ALIASES[t.trim().toLowerCase()] || t.trim().toLowerCase()).filter(Boolean);
        if (!list.length) throw new UsageError(`--tool needs at least one of: ${TOOLS.join(', ')}, all`);
        const tools = list.includes('all') ? TOOLS : list;
        const unknown = tools.filter((t) => !TOOLS.includes(t));
        if (unknown.length) throw new UsageError(`Unknown tool(s): ${unknown.join(', ')}. Use: ${TOOLS.join(', ')}, all`);
        opts.tools = [...new Set(tools)];
        break;
      }
      default:
        if (arg.startsWith('-') || opts.command) throw new UsageError(`Unexpected argument "${arg}"`);
        opts.command = arg;
    }
  }
  return opts;
}

async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.version) return log(PKG.version), 0;
  if (opts.help || !opts.command) return log(HELP), 0;
  if (!fs.existsSync(opts.dir) || !fs.statSync(opts.dir).isDirectory()) throw new UsageError(`Not a directory: ${opts.dir}`);
  if (path.resolve(opts.dir) === PKG_ROOT) throw new UsageError('Run mobie inside your app project, not inside the toolkit itself.');

  switch (opts.command) {
    case 'init': return await cmdInit(opts.dir, opts), 0;
    case 'update': return cmdUpdate(opts.dir, opts), 0;
    case 'doctor': return cmdDoctor(opts.dir);
    default: throw new UsageError(`Unknown command "${opts.command}". Run \`${NPX} --help\`.`);
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (err) => {
      if (err instanceof UsageError) {
        console.error(red(`mobie: ${err.message}`));
        process.exitCode = 2;
      } else {
        console.error(red(`mobie: ${err.stack || err.message}`));
        process.exitCode = 1;
      }
    },
  );
}

module.exports = { pickerReduce, TOOL_CHOICES };
