import type { Context } from '.keystone/types';

/** Compatibility inspection surface. Core owns relationship initialization and
 * validation; a second partial kernel must not diverge from the native schema.
 * The generator now consumes the installed Core's initialized registry directly.
 */
export function resolveRelationships(lists: Context['__internal']['lists']) {
  return Object.fromEntries(Object.entries(lists).map(([key, list]) => [key, list.resolvedDbFields]));
}
