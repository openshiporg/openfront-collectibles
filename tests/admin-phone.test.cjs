// Phone admin guards (402px audit, 2026-11-01): platform screens keep a 12px text floor and use the
// popover select/date fields instead of native controls. Static source scan; no DB or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function files(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(rel);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [rel] : [];
  });
}
const admin = [...files('features/platform'), ...files('features/dashboard')];
const offenders = (pattern, allow = []) => admin.filter((file) => !allow.includes(file))
  .flatMap((file) => fs.readFileSync(path.join(root, file), 'utf8').split('\n')
    .flatMap((line, i) => (pattern.test(line) && !/^\s*(\/?\*|\/\/)/.test(line) ? [`${file}:${i + 1}`] : [])));

test('admin text never drops below 12px', () => {
  // The Logo lockup subtitle is part of the brand mark, not readable UI text.
  assert.deepEqual(offenders(/text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/, ['features/dashboard/components/Logo.tsx']), []);
});

test('platform screens use popover selects, not native <select>', () => {
  assert.deepEqual(offenders(/<select\b/).filter((hit) => hit.startsWith('features/platform')), []);
});

test('platform screens use the calendar popover, not native date inputs', () => {
  assert.deepEqual(offenders(/type=["']date(?:time-local)?["']/).filter((hit) => hit.startsWith('features/platform')), []);
});
