'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { openDispute } from '../actions';
import { DISPUTE_TYPES } from '../lib/lifecycle';
import { Field, FormSheet, inputCls } from './form-kit';

export function OpenDisputeSheet({
  orders,
  buttonClassName,
  defaultOrderId,
}: {
  orders: { id: string; displayId: number; email?: string | null; total?: string | null }[];
  buttonClassName?: string;
  defaultOrderId?: string;
}) {
  const router = useRouter();
  return (
    <FormSheet
      title="Open case"
      description="Open a dispute case against an order"
      submitLabel="Open case"
      trigger={(open) => (
        <Button size="icon" className={buttonClassName} onClick={open}>
          <Plus />
          <span className="hidden lg:inline">Open case</span>
        </Button>
      )}
      onSubmit={async (form) => {
        const result = await openDispute({
          orderId: String(form.get('orderId') || ''),
          type: String(form.get('type') || ''),
          summary: String(form.get('summary') || ''),
        });
        if (!result.success) return result.error;
        router.push(`/dashboard/platform/disputes/${result.id}`);
      }}
    >
      <Field id="dispute-order" label="Order">
        <select id="dispute-order" name="orderId" required defaultValue={defaultOrderId || ''} className={inputCls}>
          <option value="">Select order</option>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              #{order.displayId}{order.email ? ` · ${order.email}` : ''}{order.total ? ` · ${order.total}` : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field id="dispute-type" label="Type">
        <select id="dispute-type" name="type" required defaultValue="condition" className={inputCls}>
          {DISPUTE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>
      <Field id="dispute-summary" label="Summary">
        <Textarea id="dispute-summary" name="summary" required maxLength={4000} rows={5} />
      </Field>
    </FormSheet>
  );
}
