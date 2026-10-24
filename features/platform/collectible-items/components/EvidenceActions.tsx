'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dot, Pill, Track, humanize } from '../../components/vault-ui'
import { addItemEvidence } from '../actions'
import { OPTIONS, type EvidenceKind } from '../lib/constants'

type Option = { value: string; label: string }
type Field =
  | { name: string; label: string; type: 'text' | 'datetime-local' | 'url'; required?: boolean; mono?: boolean; inputMode?: 'decimal' }
  | { name: string; label: string; type: 'textarea'; required?: boolean }
  | { name: string; label: string; type: 'select'; options: Option[]; required?: boolean }
  | { name: string; label: string; type: 'checkbox' }

const opts = (values: readonly string[]): Option[] => values.map((value) => ({ value, label: humanize(value) }))

type Props = {
  specimenId: string
  storeId?: string | null
  defaultCurrency?: string | null
  gradingCompanies: { id: string; name: string; code: string }[]
  locations: { id: string; code: string; name: string }[]
}

export function EvidenceActions({ specimenId, storeId, defaultCurrency, gradingCompanies, locations }: Props) {
  const router = useRouter()
  const [kind, setKind] = useState<EvidenceKind | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const locationOptions = [{ value: '', label: 'None' }, ...locations.map((l) => ({ value: l.id, label: `${l.code} · ${l.name}` }))]
  const forms: Record<EvidenceKind, { title: string; fields: Field[] }> = {
    identifier: {
      title: 'Add identifier',
      fields: [
        { name: 'type', label: 'Type', type: 'select', options: opts(OPTIONS.identifierType), required: true },
        { name: 'value', label: 'Value', type: 'text', required: true, mono: true },
        { name: 'issuer', label: 'Issuer', type: 'text' },
      ],
    },
    condition: {
      title: 'Add condition',
      fields: [
        { name: 'label', label: 'Condition', type: 'text', required: true },
        { name: 'scale', label: 'Scale', type: 'text' },
        { name: 'score', label: 'Score', type: 'text', mono: true },
        { name: 'sourceType', label: 'Source', type: 'select', options: opts(OPTIONS.conditionSource) },
        { name: 'status', label: 'Status', type: 'select', options: opts(OPTIONS.conditionStatus) },
        { name: 'observedAt', label: 'Observed', type: 'datetime-local' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
        { name: 'publiclyVisible', label: 'Show on storefront', type: 'checkbox' },
      ],
    },
    grade: {
      title: 'Add grade',
      fields: [
        { name: 'gradingCompanyId', label: 'Grading company', type: 'select', required: true, options: gradingCompanies.map((g) => ({ value: g.id, label: `${g.code} · ${g.name}` })) },
        { name: 'reportedGrade', label: 'Grade', type: 'text', required: true, mono: true },
        { name: 'reportedLabel', label: 'Grade label', type: 'text' },
        { name: 'certificateReference', label: 'Certificate', type: 'text', mono: true },
        { name: 'certificateLookupUrl', label: 'Certificate lookup URL', type: 'url' },
        { name: 'verificationState', label: 'Verification', type: 'select', options: opts(OPTIONS.verification) },
        { name: 'observedAt', label: 'Observed', type: 'datetime-local' },
        { name: 'publiclyVisible', label: 'Show on storefront', type: 'checkbox' },
      ],
    },
    provenance: {
      title: 'Add provenance',
      fields: [
        { name: 'eventType', label: 'Event', type: 'select', options: opts(OPTIONS.provenanceType), required: true },
        { name: 'summary', label: 'Summary', type: 'textarea', required: true },
        { name: 'source', label: 'Source', type: 'text' },
        { name: 'occurredAt', label: 'Occurred', type: 'datetime-local' },
        { name: 'confidence', label: 'Confidence', type: 'select', options: opts(OPTIONS.confidence) },
        { name: 'reviewState', label: 'Review', type: 'select', options: opts(OPTIONS.reviewState) },
        { name: 'publiclyVisible', label: 'Show on storefront', type: 'checkbox' },
      ],
    },
    custody: {
      title: 'Add custody event',
      fields: [
        { name: 'type', label: 'Type', type: 'select', options: opts(OPTIONS.custodyType), required: true },
        { name: 'fromLocationId', label: 'From', type: 'select', options: locationOptions },
        { name: 'toLocationId', label: 'To', type: 'select', options: locationOptions },
        { name: 'occurredAt', label: 'Occurred', type: 'datetime-local' },
        { name: 'counterpartyReference', label: 'Counterparty reference', type: 'text' },
      ],
    },
    valuation: {
      title: 'Add valuation',
      fields: [
        { name: 'amount', label: 'Amount', type: 'text', required: true, mono: true, inputMode: 'decimal' },
        { name: 'currencyCode', label: 'Currency', type: 'text', required: true, mono: true },
        { name: 'sourceType', label: 'Source type', type: 'select', options: opts(OPTIONS.valuationSource) },
        { name: 'sourceName', label: 'Source', type: 'text', required: true },
        { name: 'sourceReference', label: 'Reference', type: 'text' },
        { name: 'confidence', label: 'Confidence', type: 'select', options: opts(OPTIONS.confidence) },
        { name: 'observedAt', label: 'Observed', type: 'datetime-local' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
        { name: 'publiclyVisible', label: 'Show on storefront', type: 'checkbox' },
      ],
    },
    media: {
      title: 'Add media',
      fields: [
        { name: 'url', label: 'URL', type: 'url', required: true },
        { name: 'kind', label: 'Kind', type: 'select', options: opts(OPTIONS.mediaKind) },
        { name: 'visibility', label: 'Visibility', type: 'select', options: opts(OPTIONS.mediaVisibility) },
        { name: 'altText', label: 'Alt text', type: 'text' },
        { name: 'source', label: 'Source', type: 'text' },
      ],
    },
  }

  const open = (next: EvidenceKind) => {
    setError(null)
    setSaved(null)
    setKind(next)
  }

  const submit = (form: FormData) => {
    if (!kind) return
    const values: Record<string, unknown> = {}
    for (const field of forms[kind].fields) {
      values[field.name] = field.type === 'checkbox' ? form.get(field.name) === 'on' : String(form.get(field.name) ?? '')
    }
    if (kind === 'media') values.storeId = storeId
    setError(null)
    startTransition(async () => {
      const result = await addItemEvidence(kind, specimenId, values)
      if (!result.success) {
        setError(result.error)
        return
      }
      setSaved(forms[kind].title.replace(/^Add /, ''))
      setKind(null)
      router.refresh()
    })
  }

  const current = kind ? forms[kind] : null
  const inputCls = 'min-h-10'

  return (
    <>
      <div className="flex flex-col gap-2">
        <Track label="Add to record" className="max-w-full">
          {(Object.keys(forms) as EvidenceKind[]).map((key) => (
            <Pill key={key} onClick={() => open(key)} disabled={key === 'grade' && gradingCompanies.length === 0}>
              {humanize(key)}
            </Pill>
          ))}
        </Track>
        {gradingCompanies.length === 0 && <p className="text-xs text-muted-foreground">No active grading companies</p>}
        {saved && (
          <p role="status" className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
            <Dot tone="ok" /> {saved} added
          </p>
        )}
      </div>

      <Sheet open={!!kind} onOpenChange={(next) => !next && setKind(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>{current?.title}</SheetTitle>
            <SheetDescription className="sr-only">Records are permanent once added</SheetDescription>
          </SheetHeader>
          {current && (
            <form key={kind} action={submit} className="flex flex-1 flex-col gap-4 px-5 py-5">
              {current.fields.map((field) => (
                <div key={field.name} className={field.type === 'checkbox' ? 'flex items-center gap-2' : 'grid gap-1.5'}>
                  {field.type === 'checkbox' ? (
                    <>
                      <input id={`ev-${field.name}`} name={field.name} type="checkbox" className="size-4 rounded border-input" />
                      <Label htmlFor={`ev-${field.name}`} className="text-sm font-normal">{field.label}</Label>
                    </>
                  ) : (
                    <>
                      <Label htmlFor={`ev-${field.name}`}>
                        {field.label}
                        {'required' in field && field.required && <span className="text-muted-foreground"> *</span>}
                      </Label>
                      {field.type === 'select' ? (
                        <select
                          id={`ev-${field.name}`}
                          name={field.name}
                          required={field.required}
                          className="min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          defaultValue={field.required ? '' : field.options[0]?.value}
                        >
                          {field.required && <option value="">Select</option>}
                          {field.options.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <Textarea id={`ev-${field.name}`} name={field.name} required={field.required} rows={3} />
                      ) : (
                        <Input
                          id={`ev-${field.name}`}
                          name={field.name}
                          type={field.type}
                          required={field.required}
                          inputMode={'inputMode' in field ? field.inputMode : undefined}
                          defaultValue={field.name === 'currencyCode' ? (defaultCurrency || '').toUpperCase() : undefined}
                          maxLength={field.name === 'currencyCode' ? 3 : undefined}
                          className={`${inputCls} ${'mono' in field && field.mono ? 'font-mono' : ''}`}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
              {error && (
                <p role="alert" className="flex items-baseline gap-2 text-sm text-destructive">
                  <Dot tone="danger" /> {error}
                </p>
              )}
              <Track label="Form actions" className="mt-auto self-start">
                <Pill type="submit" active disabled={pending}>{pending ? 'Saving' : 'Save'}</Pill>
                <Pill onClick={() => setKind(null)}>Cancel</Pill>
              </Track>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
