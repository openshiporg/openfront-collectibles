/**
 * ProductCreatePageClient for Platform Products
 * Client component with form functionality matching dashboard CreatePage layout
 * Adapted for platform navigation and breadcrumbs
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Check } from 'lucide-react'
import { Dot, ListBand, PageTitle, Pill, SectionTitle, Track } from '@/features/platform/components/vault-ui'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageBreadcrumbs } from '../../../dashboard/components/PageBreadcrumbs'
import { Fields } from '../../../dashboard/components/Fields'
import { useCreateItem } from '../../../dashboard/utils/useCreateItem'
import { enhanceFields } from '../../../dashboard/utils/enhanceFields'
import { serializeValueToOperationItem } from '../../../dashboard/utils/useHasChanges'
import { createItemAction } from '../../../dashboard/actions/item-actions'
import { VariantsTab } from '../components/VariantsTab'
import { createProductVariant } from '../actions/variants'
import { generateUniqueProductHandle } from '../actions'
import { useRegions } from '../hooks/useProductData'


interface ProductCreatePageClientProps {
  listKey: string
  list: any
}

type VariantMode = 'default' | 'multiple'
type ProductStatus = 'draft' | 'proposed' | 'published' | 'rejected'

type DefaultVariantState = {
  title: string
  sku: string
  inventoryQuantity: string
  manageInventory: boolean
  allowBackorder: boolean
  prices: Array<{
    regionCode: string
    currencyCode: string
    amount: string
    compareAmount: string
  }>
}

type CreateDialogState = {
  status: ProductStatus
  handle: string
}

const NO_DIVISION_CURRENCIES = ['jpy', 'krw', 'vnd']

function toStorageAmount(displayAmount: string, currencyCode: string) {
  const numericAmount = parseFloat(displayAmount)
  if (Number.isNaN(numericAmount)) return null

  const isNoDivision = NO_DIVISION_CURRENCIES.includes(currencyCode.toLowerCase())
  return isNoDivision ? Math.round(numericAmount) : Math.round(numericAmount * 100)
}

function sanitizePriceInput(value: string, currencyCode: string) {
  const cleaned = value.replace(',', '.').replace(/[^\d.]/g, '')
  const isNoDivision = NO_DIVISION_CURRENCIES.includes(currencyCode.toLowerCase())

  if (isNoDivision) {
    return cleaned.replace(/\./g, '')
  }

  const firstDecimalIndex = cleaned.indexOf('.')
  if (firstDecimalIndex === -1) return cleaned

  const integerPart = cleaned.slice(0, firstDecimalIndex)
  const decimalPart = cleaned.slice(firstDecimalIndex + 1).replace(/\./g, '').slice(0, 2)

  return `${integerPart}.${decimalPart}`
}

export function ProductCreatePageClient({ listKey, list }: ProductCreatePageClientProps) {
  const router = useRouter()
  
  // Create enhanced fields like Keystone does - same pattern as dashboard
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields || {}, list.key)
  }, [list.fields, list.key])
  
  // Use the create item hook with enhanced fields
  const createItem = useCreateItem(list, enhancedFields)
  const { regions, loading: regionsLoading, error: regionsError } = useRegions()

  // Field distribution by tab following the same pattern as ProductItemPageClient
  const GENERAL_FIELDS = new Set(['title', 'handle', 'description', 'subtitle', 'isGiftcard'])
  const MEDIA_FIELDS = new Set(['productImages'])
  const VARIANT_FIELDS = new Set(['productVariants'])
  const DISCOUNT_TAX_FIELDS = new Set(['discountable', 'taxRates'])
  const STATUS_FIELDS = new Set(['status'])
  const ORGANIZATION_FIELDS = new Set(['productCollections', 'productCategories', 'productTags'])
  const HIDDEN_FIELDS = new Set(['metadata', 'externalId', 'shippingProfile', 'productType', 'productOptions'])

  const [variantMode, setVariantMode] = useState<VariantMode>('default')
  const [defaultVariant, setDefaultVariant] = useState<DefaultVariantState>({
    title: 'Default Title',
    sku: '',
    inventoryQuantity: '100',
    manageInventory: false,
    allowBackorder: false,
    prices: [],
  })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createDialogError, setCreateDialogError] = useState<string | null>(null)
  const [createDialogState, setCreateDialogState] = useState<CreateDialogState>({
    status: 'draft',
    handle: '',
  })

  const updateDefaultVariantPrice = useCallback((index: number, field: 'amount' | 'compareAmount', value: string, currencyCode: string) => {
    const nextValue = sanitizePriceInput(value, currencyCode)

    setDefaultVariant((prev) => ({
      ...prev,
      prices: prev.prices.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry
        return field === 'amount'
          ? { ...entry, amount: nextValue }
          : { ...entry, compareAmount: nextValue }
      }),
    }))
  }, [])

  const getStringFieldValue = (value: unknown): string => {
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>
      if (typeof record.value === 'string') return record.value
      if (record.value && typeof record.value === 'object') {
        const nested = record.value as Record<string, unknown>
        if (typeof nested.value === 'string') return nested.value
      }
      if (record.inner && typeof record.inner === 'object') {
        const inner = record.inner as Record<string, unknown>
        if (typeof inner.value === 'string') return inner.value
      }
    }
    return ''
  }

  const getCurrentCreateValues = useCallback(() => {
    const currentValue = (createItem?.props.value || {}) as Record<string, unknown>

    const currentTitle = getStringFieldValue(currentValue.title)
    const currentHandle = getStringFieldValue(currentValue.handle)
    const currentStatus = (getStringFieldValue(currentValue.status) || 'draft') as ProductStatus

    return {
      currentValue,
      currentTitle,
      currentHandle,
      currentStatus,
    }
  }, [createItem])

  const prepareCreateDialog = useCallback(async () => {
    if (!createItem) return

    const { currentTitle, currentHandle, currentStatus } = getCurrentCreateValues()
    let resolvedHandle = currentHandle.trim()

    if (!resolvedHandle && currentTitle.trim()) {
      const handleResponse = await generateUniqueProductHandle(currentTitle)
      if (handleResponse.success) {
        resolvedHandle = handleResponse.data.handle
      }
    }

    setCreateDialogState({
      status: currentStatus || 'draft',
      handle: resolvedHandle,
    })
    setCreateDialogError(null)
    setIsCreateDialogOpen(true)
  }, [createItem, getCurrentCreateValues])

  const handleHandleBlur = useCallback(async () => {
    const { currentTitle } = getCurrentCreateValues()
    const source = createDialogState.handle.trim() || currentTitle.trim()

    if (!source) {
      setCreateDialogState((prev) => ({ ...prev, handle: '' }))
      return
    }

    const handleResponse = await generateUniqueProductHandle(source)

    if (handleResponse.success) {
      setCreateDialogState((prev) => ({ ...prev, handle: handleResponse.data.handle }))
    }
  }, [createDialogState.handle, getCurrentCreateValues])

  const handleSave = useCallback(async () => {
    if (!createItem) return

    if (createItem.props.invalidFields.size > 0) {
      toast.error('Please complete the required product fields before creating it.')
      setCreateDialogError('Please complete the required product fields before creating the product.')
      return
    }

    setIsCreating(true)
    setCreateDialogError(null)

    try {
      const { currentValue, currentTitle } = getCurrentCreateValues()
      const handleSource = createDialogState.handle.trim() || currentTitle.trim()
      const handleResponse = await generateUniqueProductHandle(handleSource)

      if (!handleResponse.success) {
        setCreateDialogError(handleResponse.error || 'Failed to generate a unique handle.')
        setIsCreating(false)
        return
      }

      const data = serializeValueToOperationItem('create', enhancedFields, currentValue)

      data.status = createDialogState.status
      if (handleResponse.data.handle) {
        data.handle = handleResponse.data.handle
      }
      const selectedFields = `id ${list.labelField || ''}`
      const result = await createItemAction(list.key, data, selectedFields)

      if (result.errors && result.errors.length > 0) {
        setCreateDialogError(result.errors[0]?.message || 'Failed to create product.')
        setIsCreating(false)
        return
      }

      const item = result.data?.item

      if (!item?.id) {
        setCreateDialogError('Product was created without a valid ID response.')
        setIsCreating(false)
        return
      }

      if (variantMode === 'default') {
        const prices: Array<{
          amount: number
          compareAmount?: number
          currencyCode: string
          regionCode?: string
        }> = []

        defaultVariant.prices.forEach((price) => {
          if (price.amount.trim() === '') return

          const amount = toStorageAmount(price.amount, price.currencyCode)
          const compareAmount = price.compareAmount.trim() !== ''
            ? toStorageAmount(price.compareAmount, price.currencyCode)
            : null

          if (amount === null) return

          prices.push({
            amount,
            compareAmount: compareAmount ?? undefined,
            currencyCode: price.currencyCode,
            regionCode: price.regionCode,
          })
        })

        const defaultVariantResponse = await createProductVariant({
          title: defaultVariant.title || 'Default Title',
          sku: defaultVariant.sku,
          inventoryQuantity: Number.parseInt(defaultVariant.inventoryQuantity || '0', 10) || 0,
          manageInventory: defaultVariant.manageInventory,
          allowBackorder: defaultVariant.allowBackorder,
          productId: item.id,
          optionValueIds: [],
          prices,
        })

        if (!defaultVariantResponse.success) {
          toast.error('Product created, but the default variant could not be created.')
        }
      }

      router.push(`/dashboard/platform/products/${item.id}`)
    } catch (error) {
      setCreateDialogError(error instanceof Error ? error.message : 'Failed to create product.')
    } finally {
      setIsCreating(false)
    }
  }, [createItem, createDialogState, defaultVariant, enhancedFields, getCurrentCreateValues, list.key, list.labelField, router, variantMode])

  if (!list) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            The requested list "{listKey}" was not found.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!createItem) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to initialize creation form for {list.label}.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Platform-specific breadcrumb items
  const breadcrumbItems = [
    { type: 'link' as const, label: 'Dashboard', href: '' },
    { type: 'page' as const, label: 'Platform' },
    { type: 'link' as const, label: 'Products', href: '/platform/products' },
    { type: 'page' as const, label: 'Create' }
  ]

  // Split fields by position for sidebar/main layout (same pattern as dashboard)
  const fieldsSplit = useMemo(() => {
    const sidebarFields: Record<string, any> = {}
    const generalFields: Record<string, any> = {}
    const statusFields: Record<string, any> = {}
    const mediaFields: Record<string, any> = {}
    const variantFields: Record<string, any> = {}
    const discountTaxFields: Record<string, any> = {}
    const organizationFields: Record<string, any> = {}
    
    Object.entries(enhancedFields).forEach(([key, field]) => {
      const fieldPath = field.path

      if (HIDDEN_FIELDS.has(fieldPath)) return
      
      // Distribute fields by tab
      if (GENERAL_FIELDS.has(fieldPath)) {
        generalFields[key] = field
      } else if (MEDIA_FIELDS.has(fieldPath)) {
        mediaFields[key] = field
      } else if (VARIANT_FIELDS.has(fieldPath)) {
        variantFields[key] = field
      } else if (DISCOUNT_TAX_FIELDS.has(fieldPath)) {
        discountTaxFields[key] = field
      } else if (STATUS_FIELDS.has(fieldPath)) {
        statusFields[key] = field
      } else if (ORGANIZATION_FIELDS.has(fieldPath)) {
        organizationFields[key] = field
      } else {
        // Default to general tab for unknown fields
        generalFields[key] = field
      }
    })
    
    return { 
      sidebarFields, 
      generalFields, 
      statusFields,
      mediaFields, 
      variantFields, 
      discountTaxFields, 
      organizationFields 
    }
  }, [enhancedFields])

  const defaultVariantRegions = useMemo(() => {
    return (regions || []).map((region: any) => ({
      regionCode: region.code,
      label: region.name,
      currencyCode: (region.currency?.code || 'usd').toUpperCase(),
      currencySymbol: region.currency?.symbolNative || region.currency?.symbol || '',
    }))
  }, [regions])

  React.useEffect(() => {
    if (variantMode !== 'default') return

    setDefaultVariant((prev) => {
      if (prev.prices.length > 0) return prev

      return {
        ...prev,
        prices: defaultVariantRegions.map((region: any) => ({
          regionCode: region.regionCode,
          currencyCode: region.currencyCode,
          amount: '',
          compareAmount: '',
        })),
      }
    })
  }, [variantMode, defaultVariantRegions])

  const panel = 'rounded-xl bg-muted/40 p-4 ring-1 ring-inset ring-border/60 md:p-5'
  const fieldLabel = 'text-xs font-medium text-muted-foreground'

  return (
    <>
      <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <PageBreadcrumbs
            items={breadcrumbItems}
            actions={
              <Button
                size="sm"
                className="rounded-full"
                onClick={prepareCreateDialog}
                disabled={isCreating}
              >
                <Check className="mr-1.5 size-3.5" />
                {isCreating ? 'Creating...' : `Create ${list.singular}`}
              </Button>
            }
          />
      </div>

      <main className="max-w-6xl p-4 md:p-6">
        <div className="mb-8">
          <PageTitle title={`Create ${list.singular.toLowerCase()}`} />
        </div>

        {/* GraphQL errors */}
        {(createItem.error?.networkError || createItem.error?.graphQLErrors?.length) && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {createItem.error.networkError?.message ||
               createItem.error.graphQLErrors?.[0]?.message ||
               'An error occurred while creating the item'
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <div className="w-full min-w-0 flex-1 space-y-8">

            {Object.keys(fieldsSplit.generalFields).length > 0 && (
              <section>
                <SectionTitle>Details</SectionTitle>
                <div className={panel}>
                  <Fields {...createItem.props} fields={fieldsSplit.generalFields} view="createView" groups={list.groups} />
                </div>
              </section>
            )}

            <section>
              <SectionTitle>Variants and pricing</SectionTitle>
              <div className={`${panel} space-y-6`}>
                <Track label="Variant mode">
                  <Pill active={variantMode === 'default'} onClick={() => setVariantMode('default')}>
                    Single variant
                  </Pill>
                  <Pill active={variantMode === 'multiple'} onClick={() => setVariantMode('multiple')}>
                    Multiple variants
                  </Pill>
                </Track>

                {variantMode === 'default' ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="default-variant-title" className={fieldLabel}>Variant title</Label>
                        <Input
                          id="default-variant-title"
                          value={defaultVariant.title}
                          onChange={(e) => setDefaultVariant((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Default Title"
                          className="h-10 bg-background"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="default-variant-sku" className={fieldLabel}>SKU</Label>
                        <Input
                          id="default-variant-sku"
                          value={defaultVariant.sku}
                          onChange={(e) => setDefaultVariant((prev) => ({ ...prev, sku: e.target.value }))}
                          placeholder="SKU-001"
                          className="h-10 bg-background font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="default-variant-stock" className={fieldLabel}>Inventory quantity</Label>
                        <Input
                          id="default-variant-stock"
                          type="number"
                          min="0"
                          value={defaultVariant.inventoryQuantity}
                          onChange={(e) => setDefaultVariant((prev) => ({ ...prev, inventoryQuantity: e.target.value }))}
                          className="h-10 bg-background font-mono tabular-nums"
                        />
                      </div>
                    </div>

                    <ListBand className="bg-background">
                      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-2.5">
                        <span className="text-sm font-medium text-foreground">Manage inventory</span>
                        <Switch
                          checked={defaultVariant.manageInventory}
                          onCheckedChange={(checked) => setDefaultVariant((prev) => ({ ...prev, manageInventory: checked }))}
                        />
                      </label>
                      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-2.5">
                        <span className="text-sm font-medium text-foreground">Allow backorders</span>
                        <Switch
                          checked={defaultVariant.allowBackorder}
                          onCheckedChange={(checked) => setDefaultVariant((prev) => ({ ...prev, allowBackorder: checked }))}
                        />
                      </label>
                    </ListBand>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">Regional pricing</h3>
                      {regionsLoading ? (
                        <ListBand className="bg-background">
                          <div className="px-4 py-3 text-sm text-muted-foreground">Loading regions…</div>
                        </ListBand>
                      ) : regionsError ? (
                        <ListBand className="bg-background">
                          <div className="flex items-baseline gap-2.5 px-4 py-3 text-sm text-foreground">
                            <Dot tone="danger" />
                            Failed to load regions
                          </div>
                        </ListBand>
                      ) : defaultVariant.prices.length > 0 ? (
                        <ListBand className="bg-background">
                          {defaultVariant.prices.map((price, index) => {
                            const regionMeta = defaultVariantRegions.find((region: { regionCode: string; label: string; currencyCode: string; currencySymbol: string }) => region.regionCode === price.regionCode)
                            const currencySymbol = (regionMeta?.currencySymbol || '').trim() || price.currencyCode
                            const isNoDivisionCurrency = NO_DIVISION_CURRENCIES.includes(price.currencyCode.toLowerCase())

                            return (
                              <div key={`${price.regionCode}-${index}`} className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,10rem)_1fr_1fr] sm:items-end">
                                <div className="flex items-baseline gap-2 sm:pb-2.5">
                                  <span className="text-sm font-medium text-foreground">{regionMeta?.label || price.regionCode}</span>
                                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{price.currencyCode}</span>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className={fieldLabel}>Price</Label>
                                  <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                                      {currencySymbol}
                                    </div>
                                    <Input
                                      type="text"
                                      inputMode={isNoDivisionCurrency ? 'numeric' : 'decimal'}
                                      autoComplete="off"
                                      value={price.amount}
                                      onChange={(e) => updateDefaultVariantPrice(index, 'amount', e.target.value, price.currencyCode)}
                                      placeholder={isNoDivisionCurrency ? '0' : '0.00'}
                                      className="h-10 bg-background pl-9 font-mono text-sm tabular-nums"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className={fieldLabel}>Compare-at price</Label>
                                  <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                                      {currencySymbol}
                                    </div>
                                    <Input
                                      type="text"
                                      inputMode={isNoDivisionCurrency ? 'numeric' : 'decimal'}
                                      autoComplete="off"
                                      value={price.compareAmount}
                                      onChange={(e) => updateDefaultVariantPrice(index, 'compareAmount', e.target.value, price.currencyCode)}
                                      placeholder="Optional"
                                      className="h-10 bg-background pl-9 font-mono text-sm tabular-nums"
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </ListBand>
                      ) : (
                        <ListBand className="bg-background">
                          <div className="px-4 py-3 text-sm text-muted-foreground">No regions</div>
                        </ListBand>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-background p-4 ring-1 ring-border md:p-5">
                    <VariantsTab product={{}} />
                  </div>
                )}
              </div>
            </section>

            {Object.keys(fieldsSplit.mediaFields).length > 0 && (
              <section>
                <SectionTitle>Media</SectionTitle>
                <div className={panel}>
                  <Fields {...createItem.props} fields={fieldsSplit.mediaFields} view="createView" groups={list.groups} />
                </div>
              </section>
            )}
          </div>

          <aside className="w-full min-w-0 flex-shrink-0 space-y-8 lg:sticky lg:top-24 lg:w-[320px]">
            {Object.keys(fieldsSplit.statusFields).length > 0 && (
              <section>
                <SectionTitle>Status</SectionTitle>
                <div className={`${panel} [&_label]:hidden`}>
                  <Fields
                    {...createItem.props}
                    fields={fieldsSplit.statusFields}
                    view="createView"
                    groups={list.groups}
                    isRequireds={{ ...createItem.props.isRequireds, status: true }}
                  />
                </div>
              </section>
            )}

            {Object.keys(fieldsSplit.organizationFields).length > 0 && (
              <section>
                <SectionTitle>Organization</SectionTitle>
                <div className={panel}>
                  <Fields {...createItem.props} fields={fieldsSplit.organizationFields} view="createView" groups={list.groups} />
                </div>
              </section>
            )}

            {Object.keys(fieldsSplit.discountTaxFields).length > 0 && (
              <section>
                <SectionTitle>Discounts</SectionTitle>
                <div className={panel}>
                  <Fields
                    {...createItem.props}
                    fields={Object.fromEntries(
                      Object.entries(fieldsSplit.discountTaxFields).filter(([, field]) => field.path === 'discountable')
                    )}
                    view="createView"
                    groups={list.groups}
                  />
                </div>
              </section>
            )}

            {Object.keys(fieldsSplit.sidebarFields).length > 0 && (
              <div className={panel}>
                <Fields {...createItem.props} fields={fieldsSplit.sidebarFields} view="createView" groups={list.groups} />
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create</DialogTitle>
            <DialogDescription className="sr-only">
              Status and handle
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-product-status">Status</Label>
              <Select
                value={createDialogState.status}
                onValueChange={(value) => setCreateDialogState((prev) => ({ ...prev, status: value as ProductStatus }))}
              >
                <SelectTrigger id="create-product-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="proposed">Proposed</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-product-handle">Handle</Label>
              <Input
                id="create-product-handle"
                value={createDialogState.handle}
                onChange={(e) => setCreateDialogState((prev) => ({ ...prev, handle: e.target.value }))}
                onBlur={handleHandleBlur}
                placeholder="auto-generated-from-title"
              />
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleHandleBlur}
                >
                  Generate
                </Button>
              </div>
            </div>

            {createDialogError && (
              <Alert variant="destructive">
                <AlertDescription>{createDialogError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isCreating}>
              <Check className="mr-1.5 size-3.5" />
              {isCreating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProductCreatePageClient 