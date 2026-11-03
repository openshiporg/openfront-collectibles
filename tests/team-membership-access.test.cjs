// D-1: a signed-in customer may create a Team (vape) but must not place users on it,
// and sign-up must not put the new user on a team.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', 'features/keystone/models', f), 'utf8');
const field = (src, name) => {
  const start = src.indexOf(`    ${name}: relationship({`);
  assert.notEqual(start, -1, `${name} field missing`);
  return src.slice(start, src.indexOf('    }),', start));
};
const gated = /access: \{ create: permissions\.canManageUsers, update: permissions\.canManageUsers \}/;

test('Team.members and Team.leader are writable only by user managers', () => {
  const team = read('Team.ts');
  assert.match(field(team, 'members'), gated);
  assert.match(field(team, 'leader'), gated);
});

test('User.team and User.teamLead (the other side) are writable only by user managers', () => {
  const user = read('User.ts');
  assert.match(field(user, 'team'), gated);
  assert.match(field(user, 'teamLead'), gated);
});
