'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  addConsignmentItem,
  createAgreement,
  createIntake,
  transitionAgreement,
  transitionConsignmentItem,
  transitionIntake,
} from '../actions';
import { ACTION_LABELS, AGREEMENT_TRANSITIONS, INTAKE_TRANSITIONS, ITEM_TRANSITIONS } from '../lib/transitions';
import { Field, FormDialog, MovePills, fieldClass } from './controls';

const movesFor = (map: Record<string, string[]>, status?: string | null) =>
  (status ? map[status] || [] : []).map((to) => ({ to, label: ACTION_LABELS[to] || to }));

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim();

export function CreateIntakeButton({ consignors }: { consignors: { id: string; displayName: string; status: string }[] }) {
  return (
    <FormDialog
      trigger="New consignment"
      title="New consignment"
      description="Record a consignor's batch of items"
      submitLabel="Create"
      onSubmit={async (form) => {
        const result = await createIntake({
          consignorId: text(form, 'consignorId'),
          reference: text(form, 'reference'),
          description: text(form, 'description'),
        });
        return result.success
          ? { success: true, redirectTo: `/dashboard/platform/consignments/${result.data.id}` }
          : result;
      }}
    >
      <Field id="intake-consignor" label="Consignor">
        <select id="intake-consignor" name="consignorId" required className={fieldClass} defaultValue="">
          <option value="" disabled>{consignors.length ? 'Select consignor' : 'No sellers yet'}</option>
          {consignors.map((c) => (
            <option key={c.id} value={c.id}>{c.displayName}{c.status !== 'active' ? ` (${c.status})` : ''}</option>
          ))}
        </select>
      </Field>
      <Field id="intake-reference" label="Reference">
        <Input id="intake-reference" name="reference" required maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9_\-]{1,63}" className="font-mono" />
      </Field>
      <Field id="intake-description" label="Description">
        <Textarea id="intake-description" name="description" maxLength={4000} rows={3} />
      </Field>
    </FormDialog>
  );
}

export function IntakeMoves({ id, status }: { id: string; status: string }) {
  return (
    <MovePills
      label="Consignment actions"
      moves={movesFor(INTAKE_TRANSITIONS, status)}
      onMove={async (to) => {
        const result = await transitionIntake(id, to);
        return result.success ? { success: true } : result;
      }}
    />
  );
}

export function ItemMoves({ intakeId, itemId, status }: { intakeId: string; itemId: string; status: string }) {
  return (
    <MovePills
      label="Item actions"
      moves={movesFor(ITEM_TRANSITIONS, status)}
      onMove={async (to) => {
        const result = await transitionConsignmentItem(intakeId, itemId, to);
        return result.success ? { success: true } : result;
      }}
    />
  );
}

export function AgreementMoves({ intakeId, agreementId, status }: { intakeId: string; agreementId: string; status: string }) {
  return (
    <MovePills
      label="Agreement actions"
      moves={movesFor(AGREEMENT_TRANSITIONS, status)}
      onMove={async (to) => {
        const result = await transitionAgreement(intakeId, agreementId, to);
        return result.success ? { success: true } : result;
      }}
    />
  );
}

export function AddItemButton({
  intakeId,
  currencyCode,
  specimens,
}: {
  intakeId: string;
  currencyCode: string;
  specimens: { id: string; displayName: string; specimenCode: string }[];
}) {
  return (
    <FormDialog
      trigger="Add item"
      title="Add item"
      description="Add an item to this consignment"
      submitLabel="Add"
      onSubmit={async (form) => {
        const result = await addConsignmentItem({
          intakeId,
          specimenId: text(form, 'specimenId') || undefined,
          reserve: text(form, 'reserve'),
          agreedPrice: text(form, 'agreedPrice'),
          currencyCode,
          notes: text(form, 'notes'),
        });
        return result.success ? { success: true } : result;
      }}
    >
      <Field id="item-specimen" label="Item record">
        <select id="item-specimen" name="specimenId" className={fieldClass} defaultValue="">
          <option value="">Not yet recorded</option>
          {specimens.map((s) => (
            <option key={s.id} value={s.id}>{s.specimenCode} · {s.displayName}</option>
          ))}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="item-reserve" label={`Reserve (${currencyCode})`}>
          <Input id="item-reserve" name="reserve" inputMode="decimal" className="font-mono" />
        </Field>
        <Field id="item-agreed" label={`Agreed price (${currencyCode})`}>
          <Input id="item-agreed" name="agreedPrice" inputMode="decimal" className="font-mono" />
        </Field>
      </div>
      <Field id="item-notes" label="Notes">
        <Textarea id="item-notes" name="notes" maxLength={4000} rows={3} />
      </Field>
    </FormDialog>
  );
}

export function CreateAgreementButton({ intakeId, currencyCode, label }: { intakeId: string; currencyCode: string; label: string }) {
  return (
    <FormDialog
      trigger={label}
      title={label}
      description="Draft commission terms for this consignment"
      submitLabel="Create draft"
      onSubmit={async (form) => {
        const result = await createAgreement({
          intakeId,
          commissionPercent: text(form, 'commission'),
          fixedFee: text(form, 'fixedFee'),
          currencyCode: text(form, 'currencyCode') || currencyCode,
          pricingAuthority: text(form, 'pricingAuthority'),
          startsAt: text(form, 'startsAt'),
          endsAt: text(form, 'endsAt'),
        });
        return result.success ? { success: true } : result;
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="agreement-commission" label="Commission (%)">
          <Input id="agreement-commission" name="commission" required inputMode="decimal" pattern="\d{1,3}(\.\d{1,2})?" className="font-mono" />
        </Field>
        <Field id="agreement-fee" label="Fixed fee">
          <Input id="agreement-fee" name="fixedFee" inputMode="decimal" className="font-mono" />
        </Field>
        <Field id="agreement-currency" label="Currency">
          <Input id="agreement-currency" name="currencyCode" defaultValue={currencyCode} required maxLength={3} pattern="[A-Za-z]{3}" className="font-mono uppercase" />
        </Field>
        <Field id="agreement-authority" label="Pricing authority">
          <select id="agreement-authority" name="pricingAuthority" defaultValue="mutual" className={fieldClass}>
            <option value="mutual">Mutual</option>
            <option value="operator">Store</option>
            <option value="consignor">Consignor</option>
          </select>
        </Field>
        <Field id="agreement-starts" label="Starts">
          <Input id="agreement-starts" name="startsAt" type="date" />
        </Field>
        <Field id="agreement-ends" label="Ends">
          <Input id="agreement-ends" name="endsAt" type="date" />
        </Field>
      </div>
    </FormDialog>
  );
}
