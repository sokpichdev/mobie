'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const CLI = path.resolve(__dirname, '..', 'bin', 'mobie.js');

function project(markers = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mobie-test-'));
  for (const marker of markers) fs.writeFileSync(path.join(dir, marker), '');
  return dir;
}

function mobie(dir, ...args) {
  const res = spawnSync(process.execPath, [CLI, ...args, '--dir', dir], { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
  return { code: res.status, out: res.stdout + res.stderr };
}

const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');
const exists = (dir, rel) => fs.existsSync(path.join(dir, rel));
const manifest = (dir) => JSON.parse(read(dir, '.mobile-agents/.mobie-manifest.json'));

test('init on an iOS project installs iOS content and wires Claude Code', () => {
  const dir = project(['Package.swift']);
  const { code, out } = mobie(dir, 'init');
  assert.equal(code, 0, out);
  assert.match(out, /Detected platform: ios/);

  assert.ok(exists(dir, '.mobile-agents/AGENTS.md'));
  assert.ok(exists(dir, '.mobile-agents/skills/ui/ios'));
  assert.ok(!exists(dir, '.mobile-agents/skills/architecture/flutter'), 'no Flutter skills on iOS');
  assert.ok(!exists(dir, '.mobile-agents/templates/flutter'), 'no Flutter templates on iOS');

  assert.ok(exists(dir, '.claude/agents/swiftui-expert.md'));
  assert.ok(!exists(dir, '.claude/agents/flutter-expert.md'), 'no Flutter subagents on iOS');
  assert.match(read(dir, '.claude/agents/swiftui-expert.md'), /`\.mobile-agents\/agents\/swiftui_expert\.md`/);
  assert.match(read(dir, '.claude/commands/review.md'), /\(\.\.\/\.\.\/\.mobile-agents\/checklists\/code_review\.md\)/);

  assert.match(read(dir, 'CLAUDE.md'), /@\.mobile-agents\/CLAUDE\.md/);
  assert.deepEqual(manifest(dir).tools, ['claude']);

  assert.equal(mobie(dir, 'doctor').code, 0);
});

test('init detects Flutter and installs only Flutter platform content', () => {
  const dir = project(['pubspec.yaml']);
  const { code, out } = mobie(dir, 'init');
  assert.equal(code, 0, out);
  assert.match(out, /Detected platform: flutter/);
  assert.ok(exists(dir, '.mobile-agents/skills/architecture/flutter'));
  assert.ok(!exists(dir, '.mobile-agents/skills/architecture/ios'));
  assert.ok(exists(dir, '.claude/agents/flutter-expert.md'));
  assert.ok(!exists(dir, '.claude/agents/swiftui-expert.md'));
  assert.equal(mobie(dir, 'doctor').code, 0);
});

test('init keeps existing entry-file content and is idempotent', () => {
  const dir = project(['Package.swift']);
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '# Team rules\n\nUse tabs.\n');
  mobie(dir, 'init');
  const first = read(dir, 'CLAUDE.md');
  assert.ok(first.startsWith('# Team rules\n\nUse tabs.\n'));

  const { out } = mobie(dir, 'init');
  assert.equal(read(dir, 'CLAUDE.md'), first, 'block is replaced in place, not appended again');
  assert.doesNotMatch(out, /\badded\b|\bupdated\b/);
});

test('--tool wires the other tools entry files', () => {
  const dir = project(['Package.swift']);
  assert.equal(mobie(dir, 'init', '--tool', 'all').code, 0);
  assert.match(read(dir, '.cursorrules'), /@\.mobile-agents\/\.cursorrules/);
  assert.match(read(dir, '.windsurfrules'), /@\.mobile-agents\/\.windsurfrules/);
  assert.match(read(dir, 'GEMINI.md'), /@\.mobile-agents\/GEMINI\.md/);
  assert.match(read(dir, 'AGENTS.md'), /`\.mobile-agents\/AGENTS\.md`/);
  assert.equal(mobie(dir, 'doctor').code, 0);
});

test('update leaves local edits alone unless --force', () => {
  const dir = project(['Package.swift']);
  mobie(dir, 'init');
  const rel = '.mobile-agents/standards/README.md';
  fs.writeFileSync(path.join(dir, rel), 'my edit\n');

  // Simulate an older toolkit version for another file so update has work to do.
  const pristine = '.mobile-agents/checklists/README.md';
  const m = manifest(dir);
  fs.writeFileSync(path.join(dir, pristine), 'old toolkit content\n');
  m.files[pristine] = require('node:crypto').createHash('sha256').update('old toolkit content\n').digest('hex');
  fs.writeFileSync(path.join(dir, '.mobile-agents/.mobie-manifest.json'), JSON.stringify(m));

  const { out } = mobie(dir, 'update');
  assert.match(out, /skipped/);
  assert.equal(read(dir, rel), 'my edit\n');
  assert.notEqual(read(dir, pristine), 'old toolkit content\n', 'pristine file is updated');

  const doctor = mobie(dir, 'doctor');
  assert.equal(doctor.code, 0);
  assert.match(doctor.out, /edited locally/);

  mobie(dir, 'update', '--force');
  assert.notEqual(read(dir, rel), 'my edit\n');
});

test('never overwrites a pre-existing file mobie did not create', () => {
  const dir = project(['Package.swift']);
  fs.mkdirSync(path.join(dir, '.claude/agents'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude/agents/code-reviewer.md'), 'ours\n');
  const { out } = mobie(dir, 'init');
  assert.match(out, /skipped/);
  assert.equal(read(dir, '.claude/agents/code-reviewer.md'), 'ours\n');
  assert.ok(!('.claude/agents/code-reviewer.md' in manifest(dir).files));
});

test('update removes files that are no longer shipped', () => {
  const dir = project(['Package.swift']);
  mobie(dir, 'init');
  const gone = '.mobile-agents/skills/ui/ios/retired_skill.md';
  fs.writeFileSync(path.join(dir, gone), 'old\n');
  const m = manifest(dir);
  m.files[gone] = require('node:crypto').createHash('sha256').update('old\n').digest('hex');
  fs.writeFileSync(path.join(dir, '.mobile-agents/.mobie-manifest.json'), JSON.stringify(m));

  assert.match(mobie(dir, 'update').out, /removed/);
  assert.ok(!exists(dir, gone));
});

test('--dry-run writes nothing', () => {
  const dir = project(['Package.swift']);
  const { code, out } = mobie(dir, 'init', '--dry-run');
  assert.equal(code, 0, out);
  assert.deepEqual(fs.readdirSync(dir), ['Package.swift']);
});

test('doctor and update fail clearly without an install', () => {
  const dir = project();
  assert.equal(mobie(dir, 'doctor').code, 1);
  const res = mobie(dir, 'update');
  assert.equal(res.code, 2);
  assert.match(res.out, /npx @sok_pich\/mobie init/);
});

test('rejects unknown options', () => {
  const dir = project();
  assert.equal(mobie(dir, 'init', '--platform', 'windows').code, 2);
  assert.equal(mobie(dir, 'init', '--tool', 'vim').code, 2);
  assert.equal(mobie(dir, 'frobnicate').code, 2);
});

test('damaged block markers are never guessed at, so user text survives', () => {
  const dir = project(['Package.swift']);
  mobie(dir, 'init');
  const withoutEnd = read(dir, 'CLAUDE.md').replace('<!-- mobie:end -->', '') + 'USER LINE A\n';
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), withoutEnd);

  const first = mobie(dir, 'update');
  assert.match(first.out, /not wired/);
  mobie(dir, 'update');
  assert.equal(read(dir, 'CLAUDE.md'), withoutEnd);
  assert.equal(mobie(dir, 'doctor').code, 1);
});

test('re-running init keeps the recorded platform and tools', () => {
  const dir = project(['Package.swift']);
  mobie(dir, 'init', '--platform', 'all', '--tool', 'cursor');
  const { out } = mobie(dir, 'init');
  assert.doesNotMatch(out, /removed/);
  assert.equal(manifest(dir).platform, 'all');
  assert.deepEqual(manifest(dir).tools, ['cursor']);
  assert.ok(!exists(dir, 'CLAUDE.md'));
});

test('--force never deletes edited files that are no longer shipped', () => {
  const dir = project(['Package.swift']);
  mobie(dir, 'init', '--platform', 'all');
  const rel = '.mobile-agents/skills/architecture/flutter';
  const file = fs.readdirSync(path.join(dir, rel))[0];
  fs.appendFileSync(path.join(dir, rel, file), 'my notes\n');
  const { out } = mobie(dir, 'update', '--platform', 'ios', '--force');
  assert.match(out, /kept/);
  assert.ok(exists(dir, `${rel}/${file}`));
});

test('CRLF checkouts are not treated as local edits', () => {
  const dir = project(['Package.swift']);
  mobie(dir, 'init');
  const rel = '.mobile-agents/standards/README.md';
  fs.writeFileSync(path.join(dir, rel), read(dir, rel).replace(/\n/g, '\r\n'));
  assert.doesNotMatch(mobie(dir, 'update').out, /skipped/);
  assert.doesNotMatch(mobie(dir, 'doctor').out, /edited locally/);
});

test('rejects a manifest that points outside the toolkit folders', () => {
  const dir = project(['Package.swift']);
  mobie(dir, 'init');
  const outside = path.join(path.dirname(dir), `${path.basename(dir)}-victim.txt`);
  fs.writeFileSync(outside, '');
  const m = manifest(dir);
  m.files[`../${path.basename(outside)}`] = require('node:crypto').createHash('sha256').update('').digest('hex');
  fs.writeFileSync(path.join(dir, '.mobile-agents/.mobie-manifest.json'), JSON.stringify(m));

  const res = mobie(dir, 'update');
  assert.equal(res.code, 2);
  assert.match(res.out, /invalid/);
  assert.ok(fs.existsSync(outside));
});

test('leaves the user\'s own empty .claude folders alone', () => {
  const dir = project(['Package.swift']);
  fs.mkdirSync(path.join(dir, '.claude/hooks'), { recursive: true });
  mobie(dir, 'init');
  mobie(dir, 'update', '--tool', 'cursor');
  assert.ok(exists(dir, '.claude/hooks'));
  assert.ok(!exists(dir, '.claude/agents/swiftui-expert.md'), 'dropped tool files are removed');
});

test('rejects an empty --tool list', () => {
  const dir = project(['Package.swift']);
  assert.equal(mobie(dir, 'init', '--tool=,').code, 2);
});

test('tool picker: move, toggle, select all, and require a choice', () => {
  const { pickerReduce, TOOL_CHOICES } = require('../bin/mobie.js');
  let state = { cursor: 0, selected: ['claude'], error: null };

  state = pickerReduce(state, 'down');
  state = pickerReduce(state, 'space');
  assert.deepEqual(state.selected, ['claude', 'codex']);

  state = pickerReduce(state, 'up');
  state = pickerReduce(state, 'up');
  assert.equal(state.cursor, TOOL_CHOICES.length - 1, 'wraps around');

  state = pickerReduce(state, 'a');
  assert.equal(state.selected.length, TOOL_CHOICES.length);
  state = pickerReduce(state, 'a');
  assert.deepEqual(state.selected, []);

  state = pickerReduce(state, 'return');
  assert.ok(!state.done);
  assert.match(state.error, /at least one/);

  state = pickerReduce(pickerReduce(state, 'space'), 'return');
  assert.ok(state.done);
});

test('--tool accepts gpt/openai/chatgpt as aliases for codex', () => {
  const dir = project(['Package.swift']);
  assert.equal(mobie(dir, 'init', '--tool', 'claude,GPT').code, 0);
  assert.deepEqual(manifest(dir).tools, ['claude', 'codex']);
  assert.match(read(dir, 'AGENTS.md'), /\.mobile-agents\/AGENTS\.md/);
});
