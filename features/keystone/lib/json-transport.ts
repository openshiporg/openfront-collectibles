import type { JSONValue } from '@keystone-6/core/types';

/** Explicit JSON DTO boundary: dates become ISO strings; undefined keys are
 * omitted. Not an authorization/redaction step: callers must project first.
 */
export function jsonTransport(value: unknown): JSONValue {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) return null;
  if (Buffer.byteLength(serialized, 'utf8') > 1_048_576) throw new Error('Record projection exceeds the supported size');
  return JSON.parse(serialized) as JSONValue;
}
