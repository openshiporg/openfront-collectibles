'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pill, Track } from '@/features/platform/components/vault-ui';
import { Field, FormDialog, MovePills, fieldClass } from '../../consignments/components/controls';
import {
  addTradeInItem,
  createSubmission,
  linkSpecimen,
  quoteTradeInItem,
  recordInspection,
  setAcceptedAmount,
  transitionSubmission,
} from '../actions';
import { ACTION_LABELS, SUBMISSION_TRANSITIONS } from '../lib/transitions';

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim();

export function CreateSubmissionButton({ customers }: { customers: { id: string; name: string; email: string }[] }) {
  return (
    <FormDialog
      trigger="New trade-in"
      title="New trade-in"
      description="Start a trade-in for a customer"
      submitLabel="Create"
      onSubmit={async (form) => {
        const result = await createSubmission({
          customerId: text(form, 'customerId'),
          reference: text(form, 'reference'),
          disposition: text(form, 'disposition'),
        });
        return result.success ? { success: true, redirectTo: `/dashboard/platform/trade-ins/${result.data.id}` } : result;
      }}
    >
      <Field id="tradein-customer" label="Customer">
        <select id="tradein-customer" name="customerId" required defaultValue="" className={fieldClass}>
          <option value="" disabled>{customers.length ? 'Select customer' : 'No customers yet'}</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name ? `${c.name} · ${c.email}` : c.email}</option>
          ))}
        </select>
      </Field>
      <Field id="tradein-reference" label="Reference">
        <Input id="tradein-reference" name="reference" required maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9_\-]{1,63}" className="font-mono" />
      </Field>
      <Field id="tradein-disposition" label="Payout">
        <select id="tradein-disposition" name="disposition" defaultValue="cash" className={fieldClass}>
          <option value="cash">Cash</option>
          <option value="store_credit">Store credit</option>
          <option value="trade">Trade</option>
        </select>
      </Field>
    </FormDialog>
  );
}

export function SubmissionMoves({ id, status }: { id: string; status: string }) {
  const moves = (SUBMISSION_TRANSITIONS[status] || []).map((to) => ({ to, label: ACTION_LABELS[to] || to }));
  return (
    <MovePills
      label="Trade-in actions"
      moves={moves}
      onMove={async (to) => {
        const result = await transitionSubmission(id, to);
        return result.success ? { success: true } : result;
      }}
    />
  );
}

export function AddTradeInItemButton({
  submissionId,
  catalogItems,
}: {
  submissionId: string;
  catalogItems: { id: string; title: string; catalogNumber?: string | null; year?: number | null }[];
}) {
  return (
    <FormDialog
      trigger="Add item"
      title="Add item"
      description="Add an item the customer is trading in"
      submitLabel="Add"
      onSubmit={async (form) => {
        const result = await addTradeInItem({
          submissionId,
          catalogItemId: text(form, 'catalogItemId') || undefined,
          description: text(form, 'description'),
          condition: text(form, 'condition'),
        });
        return result.success ? { success: true } : result;
      }}
    >
      <Field id="tradein-item-catalog" label="Catalogue item">
        <select id="tradein-item-catalog" name="catalogItemId" defaultValue="" className={fieldClass}>
          <option value="">Not in the catalogue</option>
          {catalogItems.map((c) => (
            <option key={c.id} value={c.id}>{[c.title, c.catalogNumber, c.year].filter(Boolean).join(' · ')}</option>
          ))}
        </select>
      </Field>
      <Field id="tradein-item-description" label="Description">
        <Textarea id="tradein-item-description" name="description" maxLength={4000} rows={3} />
      </Field>
      <Field id="tradein-item-condition" label="Customer's condition">
        <Input id="tradein-item-condition" name="condition" maxLength={300} />
      </Field>
    </FormDialog>
  );
}

/** Inline amount entry (quote or accepted amount) as an input plus a raised pill. */
export function AmountForm({
  label,
  submit,
  submissionId,
  itemId,
  currencyCode,
  defaultValue,
  kind,
}: {
  label: string;
  submit: string;
  submissionId: string;
  itemId: string;
  currencyCode: string;
  defaultValue?: string;
  kind: 'quote' | 'accepted';
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const inputId = `${kind}-${itemId}`;
  return (
    <form
      className="space-y-1"
      action={(form) =>
        startTransition(async () => {
          setError('');
          const args = { submissionId, itemId, amount: text(form, 'amount'), currencyCode };
          const result = kind === 'quote' ? await quoteTradeInItem(args) : await setAcceptedAmount(args);
          if (result.success) router.refresh();
          else setError(result.error);
        })
      }
    >
      <label htmlFor={inputId} className="text-xs text-muted-foreground">{label} ({currencyCode})</label>
      <div className="flex items-center gap-2">
        <Input id={inputId} name="amount" required inputMode="decimal" defaultValue={defaultValue} className="h-9 w-32 font-mono max-sm:h-10" />
        <Track label={submit}>
          <Pill type="submit" active disabled={pending}>{pending ? 'Saving' : submit}</Pill>
        </Track>
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </form>
  );
}

export function InspectionButton({ submissionId, itemId, specimenId }: { submissionId: string; itemId: string; specimenId: string }) {
  return (
    <FormDialog
      trigger="Record inspection"
      title="Record inspection"
      description="Add a condition observation to the item record"
      submitLabel="Save"
      onSubmit={async (form) => {
        const result = await recordInspection({
          submissionId,
          itemId,
          specimenId,
          label: text(form, 'label'),
          score: text(form, 'score'),
          notes: text(form, 'notes'),
        });
        return result.success ? { success: true } : result;
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <Field id={`inspect-label-${itemId}`} label="Condition">
          <Input id={`inspect-label-${itemId}`} name="label" required maxLength={300} />
        </Field>
        <Field id={`inspect-score-${itemId}`} label="Score">
          <Input id={`inspect-score-${itemId}`} name="score" maxLength={40} className="font-mono" />
        </Field>
      </div>
      <Field id={`inspect-notes-${itemId}`} label="Notes">
        <Textarea id={`inspect-notes-${itemId}`} name="notes" maxLength={4000} rows={3} />
      </Field>
    </FormDialog>
  );
}

export function LinkSpecimenForm({
  submissionId,
  itemId,
  specimens,
}: {
  submissionId: string;
  itemId: string;
  specimens: { id: string; displayName: string; specimenCode: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const selectId = `link-${itemId}`;
  if (!specimens.length) return null;
  return (
    <form
      className="space-y-1"
      action={(form) =>
        startTransition(async () => {
          setError('');
          const result = await linkSpecimen({ submissionId, itemId, specimenId: text(form, 'specimenId') });
          if (result.success) router.refresh();
          else setError(result.error);
        })
      }
    >
      <label htmlFor={selectId} className="text-xs text-muted-foreground">Item record</label>
      <div className="flex items-center gap-2">
        <select id={selectId} name="specimenId" required defaultValue="" className={`${fieldClass} h-9 max-w-56`}>
          <option value="" disabled>Select record</option>
          {specimens.map((s) => (
            <option key={s.id} value={s.id}>{s.specimenCode} · {s.displayName}</option>
          ))}
        </select>
        <Track label="Link record">
          <Pill type="submit" active disabled={pending}>{pending ? 'Linking' : 'Link'}</Pill>
        </Track>
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
