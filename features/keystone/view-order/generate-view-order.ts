#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Context } from '.keystone/types';

type InitialisedLists = Context['__internal']['lists'];
const corePrefix = '@keystone-6/core/fields/types/';
const viewNames = new Map<string, string>([
  ...['text', 'password', 'relationship', 'json', 'timestamp', 'checkbox', 'select', 'integer', 'bigInt', 'float', 'decimal', 'image', 'virtual'].map(name => [`${corePrefix}${name}/views`, name] as [string, string]),
  ['@keystone-6/fields-document/views', 'document'],
  ['@keystone-6/core/___internal-do-not-use-will-break-in-patch/admin-ui/id-field-view', 'id'],
]);

// Adapt the family view-order protocol, using the installed Core's actual
// initialized registry, not the donor's 935-line partial copy of its kernel.
// Traversal and omission rules match Core6.5.3 create-admin-meta.ts.
export function buildViewOrder(lists: InitialisedLists): string[] {
  const omitted = new Set(Object.keys(lists).filter(key => !lists[key].graphql.isEnabled.query));
  const views: string[] = [], seen = new Set<string>();
  const add = (view: string) => {
    if (seen.has(view)) return;
    const name = viewNames.get(view);
    if (!name) throw new Error(`Unsupported field view: ${view}`);
    seen.add(view); views.push(name);
  };
  for (const [key, list] of Object.entries(lists)) {
    if (omitted.has(key)) continue;
    for (const field of Object.values(list.fields)) {
      if (field.dbField.kind === 'relation' && omitted.has(field.dbField.list)) continue;
      if (Object.values(field.graphql.isEnabled).every(value => value === false)) continue;
      add(field.views);
      if (field.ui.views !== null) add(field.ui.views);
    }
  }
  if (views[0] !== 'id' || views.slice(1).includes('id')) throw new Error('Installed Core ID-view offset changed');
  // The family dashboard explicitly prepends ID at viewsIndex0.
  return views.slice(1);
}

export async function main() {
  const { keystoneContext: context } = await import('../context');
  try {
    const views = buildViewOrder(context.__internal.lists);
    const output = `/** Generated from installed Core metadata by generate-view-order.ts. */\nexport const VIEW_ORDER = ${JSON.stringify(views, null, 2)};\n`;
    writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.ts'), output);
    console.log(`Generated ${views.length} field views for ${Object.keys(context.__internal.lists).length} lists`);
  } finally { await context.prisma.$disconnect(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  void main().catch(error => { console.error(error instanceof Error ? error.message : 'View generation failed'); process.exitCode = 1; });
}
