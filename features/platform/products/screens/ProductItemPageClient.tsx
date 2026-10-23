/**
 * ProductItemPageClient - Modern product edit page
 */

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Fields } from '../../../dashboard/components/Fields'
import { PageBreadcrumbs } from '../../../dashboard/components/PageBreadcrumbs'
import { useInvalidFields } from '../../../dashboard/utils/useInvalidFields'
import { useHasChanges, serializeValueToOperationItem } from '../../../dashboard/utils/useHasChanges'
import { enhanceFields } from '../../../dashboard/utils/enhanceFields'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { ArrowUpRight, Check, Copy, RotateCcw, Trash2 } from 'lucide-react'
import { Dot, ListBand, SectionTitle } from '@/features/platform/components/vault-ui'
import { productStatusConfig } from '../components/StatusBadge'
import { toast } from 'sonner'
import { updateItemAction, deleteItemAction } from '../../../dashboard/actions/item-actions'
import { VariantsTab } from '../components/VariantsTab'
import { MediaTab } from '../components/MediaTab'


interface ProductItemPageClientProps {
  list: any
  item: Record<string, unknown>
  itemId: string
}

function useEventCallback<Func extends (...args: any[]) => unknown>(callback: Func): Func {
  const callbackRef = useRef(callback)
  const cb = useCallback((...args: any[]) => {
    return callbackRef.current(...args)
  }, [])
  useEffect(() => {
    callbackRef.current = callback
  })
  return cb as any
}

function DeleteButton({ list, value, onError }: { list: any; value: Record<string, unknown>; onError: (error: Error) => void }) {
  const itemId = ((value.id ?? '') as string | number).toString()
  const router = useRouter()

  const handleDelete = useEventCallback(async () => {
    try {
      const { errors } = await deleteItemAction(list.key, itemId)
      const error = errors?.find(x => x.path === undefined || x.path?.length === 1)
      if (error) {
        toast.error('Unable to delete product.', { action: { label: 'Details', onClick: () => onError(new Error(error.message)) } })
        return
      }
      toast.success(`${list.singular} deleted successfully.`)
      router.push('/dashboard/platform/products')
    } catch (err: any) {
      toast.error("Unable to delete product.", { action: { label: "Details", onClick: () => onError(err) } })
    }
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="rounded-full">
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function deserializeItemToValue(enhancedFields: Record<string, any>, item: Record<string, unknown | null>) {
  const result: Record<string, unknown | null> = {}
  Object.entries(enhancedFields).forEach(([fieldPath, field]) => {
    try {
      const controller = field.controller
      const itemForField: Record<string, unknown> = {}
      itemForField[field.path] = item?.[field.path] ?? null
      result[fieldPath] = controller.deserialize(itemForField)
    } catch (error) {
      console.error(`Error deserializing field ${fieldPath}:`, error)
    }
  })
  return result
}

function getRelatedCount(value: unknown): number {
  if (value && typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
    const relationshipValue = (value as { value?: unknown }).value
    if (Array.isArray(relationshipValue)) return relationshipValue.length
    if (relationshipValue && typeof relationshipValue === 'object') return 1
  }
  if (Array.isArray(value)) return value.length
  if (value && typeof value === 'object') return 1
  return 0
}

export function ProductItemPageClient({ list, item, itemId }: ProductItemPageClientProps) {
  const router = useRouter()
  
  const enhancedFields = useMemo(() => enhanceFields(list.fields || {}, list.key), [list.fields, list.key])
  const initialValue = useMemo(() => deserializeItemToValue(enhancedFields, item), [enhancedFields, item])
  
  const [value, setValue] = useState(() => initialValue)
  const [loading, setLoading] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [forceValidation, setForceValidation] = useState(false)
  const [errorDialogValue, setErrorDialogValue] = useState<Error | null>(null)
  
  useEffect(() => { setValue(initialValue) }, [initialValue])

  const isRequireds = useMemo(() => {
    const result: Record<string, any> = {}
    Object.entries(enhancedFields).forEach(([fieldPath, field]) => {
      result[fieldPath] = field.itemView?.isRequired || false
    })
    if (list.adminMetaFields) {
      list.adminMetaFields.forEach((field: any) => {
        if (field.itemView && field.itemView.isRequired !== undefined) {
          result[field.path] = field.itemView.isRequired
        }
      })
    }
    return result
  }, [enhancedFields, list.adminMetaFields])

  const invalidFields = useInvalidFields(enhancedFields, value, isRequireds)
  const hasChanges = useHasChanges('update', enhancedFields, value, initialValue)

  const handleSave = useCallback(async () => {
    if (!hasChanges || loading) return
    setLoading(true)
    setSaveState('saving')
    setForceValidation(true)

    if (invalidFields.size > 0) {
      setLoading(false)
      setSaveState('idle')
      toast.error('Please fix validation errors before saving')
      return
    }

    try {
      const data = serializeValueToOperationItem('update', enhancedFields, value, initialValue)
      const result = await updateItemAction(list.key, itemId, data)
      
      if (result.errors && result.errors.length > 0) {
        toast.error('Failed to save changes', { action: { label: 'Details', onClick: () => setErrorDialogValue(new Error(result.errors[0]?.message || 'Update failed')) } })
        setLoading(false)
        setSaveState('idle')
        return
      }
      
      toast.success('Saved')
      setSaveState('saved')
      setForceValidation(false)
      setTimeout(() => setSaveState('idle'), 2000)
    } catch (error: any) {
      toast.error('Failed to save changes', { action: { label: 'Details', onClick: () => setErrorDialogValue(error) } })
      setSaveState('idle')
    } finally {
      setLoading(false)
    }
  }, [hasChanges, loading, invalidFields, enhancedFields, value, initialValue, list.key, itemId])

  const handleReset = useCallback(() => {
    setValue(initialValue)
    setForceValidation(false)
  }, [initialValue])

  const pageLabel = (item[list.labelField] || item.id || itemId) as string

  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(itemId)
    toast.success('Copied')
  }, [itemId])

  const GENERAL_FIELDS = new Set(['title', 'handle', 'description', 'subtitle', 'isGiftcard'])
  const STATUS_FIELDS = new Set(['status'])
  const ORGANIZATION_FIELDS = new Set(['productCollections', 'productCategories', 'productTags'])
  const DISCOUNT_TAX_FIELDS = new Set(['discountable', 'taxRates'])

  const fieldsSplit = useMemo(() => {
    const generalFields: Record<string, any> = {}
    const statusFields: Record<string, any> = {}
    const organizationFields: Record<string, any> = {}
    const discountTaxFields: Record<string, any> = {}
    
    Object.entries(enhancedFields).forEach(([key, field]) => {
      const fieldPath = field.path
      if (GENERAL_FIELDS.has(fieldPath)) generalFields[key] = field
      else if (STATUS_FIELDS.has(fieldPath)) statusFields[key] = field
      else if (ORGANIZATION_FIELDS.has(fieldPath)) organizationFields[key] = field
      else if (DISCOUNT_TAX_FIELDS.has(fieldPath)) discountTaxFields[key] = field
    })
    
    return { generalFields, statusFields, organizationFields, discountTaxFields }
  }, [enhancedFields])

  const breadcrumbItems = [
    { type: 'link' as const, label: 'Platform', href: '/platform' },
    { type: 'link' as const, label: 'Products', href: '/platform/products' },
    { type: 'page' as const, label: pageLabel }
  ]

  const discountEligibilityEnabled = Boolean((value as Record<string, unknown>).discountable)
  const linkedTaxRateCount = getRelatedCount((value as Record<string, unknown>).taxRates)

  const savedStatus = productStatusConfig[item.status as keyof typeof productStatusConfig]
  const variantCount = Array.isArray(item.productVariants) ? (item.productVariants as unknown[]).length : undefined
  const panel = 'rounded-xl bg-muted/40 p-4 ring-1 ring-inset ring-border/60 md:p-5'

  if (!item || Object.keys(item).length === 0) {
    return (
      <div className="px-4 py-10 md:px-6">
        <ListBand>
          <div className="px-4 py-3 text-sm text-muted-foreground">Product not found</div>
        </ListBand>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen pb-20">
        <div className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <PageBreadcrumbs
            items={breadcrumbItems}
            actions={
              <div className="flex items-center gap-2">
                {!list.hideDelete && <DeleteButton list={list} value={value} onError={setErrorDialogValue} />}
                {hasChanges && (
                  <Button variant="outline" size="sm" className="rounded-full" onClick={handleReset}>
                    <RotateCcw className="size-3.5" />
                    Reset
                  </Button>
                )}
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={handleSave}
                  disabled={!hasChanges || loading || saveState === 'saving'}
                >
                  <Check className="size-3.5" />
                  Save Changes
                </Button>
              </div>
            }
          />
        </div>

        <main className="max-w-6xl p-4 md:p-6">
          <div className="mb-8 flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{pageLabel}</h1>
              {savedStatus && (
                <span className="inline-flex items-baseline gap-1.5 text-sm text-muted-foreground">
                  <Dot tone={savedStatus.tone} />
                  {savedStatus.label}
                </span>
              )}
              {hasChanges && (
                <span className="inline-flex items-baseline gap-1.5 text-sm text-muted-foreground">
                  <Dot tone="warn" />
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 font-mono text-sm tabular-nums text-muted-foreground">
              {typeof item.handle === 'string' && item.handle && <span>/{item.handle}</span>}
              {variantCount !== undefined && <span>{variantCount} variants</span>}
            </div>
          </div>

          <div className="flex flex-col items-start gap-8 lg:flex-row">
            <div className="w-full min-w-0 flex-1 space-y-8">
              {Object.keys(fieldsSplit.generalFields).length > 0 && (
                <section>
                  <SectionTitle>Details</SectionTitle>
                  <div className={panel}>
                    <Fields
                      list={list}
                      fields={fieldsSplit.generalFields}
                      value={value}
                      onChange={setValue}
                      forceValidation={forceValidation}
                      invalidFields={invalidFields}
                      isRequireds={isRequireds}
                    />
                  </div>
                </section>
              )}

              <section>
                <SectionTitle meta={variantCount}>Variants and pricing</SectionTitle>
                <div className={panel}>
                  <VariantsTab product={item} />
                </div>
              </section>

              <section>
                <SectionTitle>Media</SectionTitle>
                <div className={panel}>
                  <MediaTab product={item} />
                </div>
              </section>
            </div>

            <aside className="w-full min-w-0 flex-shrink-0 space-y-8 lg:sticky lg:top-24 lg:w-[320px]">
              {Object.keys(fieldsSplit.statusFields).length > 0 && (
                <section>
                  <SectionTitle>Status</SectionTitle>
                  <div className={`${panel} [&_label]:hidden`}>
                    <Fields
                      list={list}
                      fields={fieldsSplit.statusFields}
                      value={value}
                      onChange={setValue}
                      forceValidation={forceValidation}
                      invalidFields={invalidFields}
                      isRequireds={{ ...isRequireds, status: true }}
                    />
                  </div>
                </section>
              )}

              {Object.keys(fieldsSplit.organizationFields).length > 0 && (
                <section>
                  <SectionTitle>Organization</SectionTitle>
                  <div className={panel}>
                    <Fields
                      list={list}
                      fields={fieldsSplit.organizationFields}
                      value={value}
                      onChange={setValue}
                      forceValidation={forceValidation}
                      invalidFields={invalidFields}
                      isRequireds={isRequireds}
                    />
                  </div>
                </section>
              )}

              {Object.keys(fieldsSplit.discountTaxFields).length > 0 && (
                <section>
                  <SectionTitle
                    meta={
                      <Link
                        href="/dashboard/platform/discounts"
                        className="inline-flex items-center gap-1 font-sans text-xs font-medium text-foreground hover:underline underline-offset-4"
                      >
                        Discounts
                        <ArrowUpRight className="size-3" />
                      </Link>
                    }
                  >
                    Discounts and tax
                  </SectionTitle>
                  <ListBand>
                    <div className="flex items-baseline justify-between gap-3 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Discount eligibility</span>
                      <span className="inline-flex items-baseline gap-1.5 text-foreground">
                        <Dot tone={discountEligibilityEnabled ? 'ok' : 'muted'} />
                        {discountEligibilityEnabled ? 'Eligible' : 'Blocked'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Linked tax rates</span>
                      <span className="font-mono tabular-nums text-foreground">{linkedTaxRateCount}</span>
                    </div>
                    <div className="px-4 py-4">
                      <Fields
                        list={list}
                        fields={fieldsSplit.discountTaxFields}
                        value={value}
                        onChange={setValue}
                        forceValidation={forceValidation}
                        invalidFields={invalidFields}
                        isRequireds={isRequireds}
                      />
                    </div>
                  </ListBand>
                </section>
              )}

              <section>
                <SectionTitle>Reference</SectionTitle>
                <ListBand>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    aria-label="Copy product ID"
                    className="group flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
                  >
                    <span className="text-sm text-muted-foreground">ID</span>
                    <span className="flex min-w-0 items-center gap-2">
                      <code className="truncate font-mono text-xs text-foreground">{itemId}</code>
                      <Copy className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    </span>
                  </button>
                </ListBand>
              </section>
            </aside>
          </div>
        </main>
      </div>

      {errorDialogValue && (
        <AlertDialog open={true} onOpenChange={() => setErrorDialogValue(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Error</AlertDialogTitle>
              <AlertDialogDescription>{errorDialogValue.message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setErrorDialogValue(null)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

export default ProductItemPageClient
