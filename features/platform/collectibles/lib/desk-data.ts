import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';
import type { DotTone } from '@/features/platform/components/vault-ui';

export type QueueRow = { id: string; title: string; state?: string; tone?: DotTone; meta?: string; trailing?: string };

export type QueueStatus = { value: string; label?: string; tone: DotTone };

export type QueueSpec = {
  key: string;
  title: string;
  /** Keystone list type, e.g. `InventoryUnit` */
  type: string;
  /** Plural query name, e.g. `inventoryUnits` */
  list: string;
  /** Dashboard list path, e.g. `inventory-units` */
  path: string;
  statusField?: string;
  statuses?: QueueStatus[];
  where?: Record<string, unknown>;
  fields: string;
  orderBy?: string;
  take?: number;
  row: (record: any) => Omit<QueueRow, 'id'>;
};

export type QueueCount = QueueStatus & { count: number; href: string };

export type QueueResult = {
  key: string;
  title: string;
  path: string;
  statusField?: string;
} & (
  | { ok: true; total: number; counts: QueueCount[]; rows: QueueRow[] }
  | { ok: false }
);

export function listFilterHref(path: string, field: string, value: string) {
  return `/dashboard/${path}?${encodeURIComponent(`!${field}_matches`)}=${encodeURIComponent(JSON.stringify([value]))}`;
}

export async function loadQueue(spec: QueueSpec): Promise<QueueResult> {
  const base = { key: spec.key, title: spec.title, path: spec.path, statusField: spec.statusField };
  const where = spec.where ?? {};
  const statuses = spec.statusField ? spec.statuses ?? [] : [];
  const variables: Record<string, unknown> = { where };
  const declarations = [`$where: ${spec.type}WhereInput!`];
  const countFields = statuses.map((status, index) => {
    variables[`w${index}`] = { AND: [where, { [spec.statusField!]: { equals: status.value } }] };
    declarations.push(`$w${index}: ${spec.type}WhereInput!`);
    return `s${index}: ${spec.list}Count(where: $w${index})`;
  });

  const operationName = `Desk_${spec.key.replace(/[^A-Za-z0-9_]/g, '_')}`;
  const query = `query ${operationName}(${declarations.join(', ')}) {
    total: ${spec.list}Count(where: $where)
    rows: ${spec.list}(where: $where, take: ${spec.take ?? 6}, orderBy: [{ ${spec.orderBy ?? 'createdAt'}: desc }]) { id ${spec.fields} }
    ${countFields.join('\n    ')}
  }`;

  try {
    const response = await keystoneClient(query, variables);
    if (!response.success) {
      console.error(`Desk queue ${spec.key} failed:`, response.error);
      return { ...base, ok: false };
    }
    const data = response.data as Record<string, any>;
    const rows: QueueRow[] = Array.isArray(data.rows)
      ? data.rows.map((record: any) => ({ id: String(record.id), ...spec.row(record) }))
      : [];
    return {
      ...base,
      ok: true,
      total: Number(data.total) || 0,
      rows,
      counts: statuses.map((status, index) => ({
        ...status,
        count: Number(data[`s${index}`]) || 0,
        href: listFilterHref(spec.path, spec.statusField!, status.value),
      })),
    };
  } catch {
    console.error(`Desk queue ${spec.key} failed`);
    return { ...base, ok: false };
  }
}
