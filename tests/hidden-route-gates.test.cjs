const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const platform = path.join(root, 'app/dashboard/(admin)/platform');

function pages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return pages(full);
    return entry.name === 'page.tsx' ? [full] : [];
  });
}

test('every platform page, including create/receive/detail sub-pages, goes through the parent page gate', () => {
  const ungated = pages(platform).filter((file) => !fs.readFileSync(file, 'utf8').includes('gatePlatformPage('));
  assert.deepEqual(ungated.map((file) => path.relative(platform, file)), []);
});

test('sub-pages use their parent slug, so a role whose parent page is 404 gets 404 below it', () => {
  for (const file of pages(platform)) {
    const rel = path.relative(platform, file).split(path.sep);
    if (rel.length < 3) continue;
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, new RegExp(`gatePlatformPage\\('${rel[0]}'`), rel.join('/'));
  }
});

test('list, create and item screens 404 a list hidden for the session', () => {
  for (const screen of ['ListPage', 'CreatePage', 'ItemPage']) {
    const source = fs.readFileSync(path.join(root, `features/dashboard/screens/${screen}/index.tsx`), 'utf8');
    assert.match(source, /if \(!list \|\| list\.isHidden\) \{\s*notFound\(\)/, screen);
  }
});

test('the order confirmation route has no loading boundary that would commit a 200 before notFound()', () => {
  assert.equal(fs.existsSync(path.join(root, 'app/(storefront)/[countryCode]/(main)/order/confirmed/[id]/loading.tsx')), false);
});
