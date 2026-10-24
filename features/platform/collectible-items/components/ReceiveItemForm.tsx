'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dot, ListBand, Pill, SectionTitle, Track } from '../../components/vault-ui'
import { money } from '../../collectibles/lib/format'
import { getReceiveOptions, receiveItem } from '../actions'

type Variant = { id: string; sku: string | null; title: string | null; product?: { id: string; title: string; status: string } | null; prices?: { amount: number; currency?: { code: string } | null }[] }
type Category = { id: string; name: string; handle: string; status: string }

const selectCls = 'min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)

export function ReceiveItemForm({
  initialVariants,
  categories,
  currencyCode,
}: {
  initialVariants: Variant[]
  categories: Category[]
  currencyCode: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [variants, setVariants] = useState<Variant[]>(initialVariants)
  const [variantId, setVariantId] = useState('')
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [categoryMode, setCategoryMode] = useState<'existing' | 'new'>(categories.length ? 'existing' : 'new')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [publish, setPublish] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const timer = setTimeout(async () => {
      const result = await getReceiveOptions(search)
      if (result.success) setVariants(result.data.productVariants)
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  const receivable = variants.filter((v) => v.sku)
  const variant = receivable.find((v) => v.id === variantId)
  const price = useMemo(
    () => variant?.prices?.find((p) => p.currency?.code?.toUpperCase() === currencyCode.toUpperCase()),
    [variant, currencyCode]
  )

  const chooseVariant = (id: string) => {
    setVariantId(id)
    const next = receivable.find((v) => v.id === id)
    if (next) {
      setCode((current) => current || (next.sku ?? ''))
      setTitle((current) => current || next.product?.title || '')
    }
  }

  const submit = (form: FormData) => {
    setError(null)
    if (!variant) return setError('Choose a product variant')
    if (publish && variant.product?.status !== 'published') return setError('Publish the product before listing the item')
    if (publish && !price) return setError(`Add a ${currencyCode.toUpperCase()} price to ${variant.sku} before listing the item`)
    const category = categoryMode === 'existing' ? String(form.get('category') || '') : slug(newCategoryName)
    if (!category) return setError('Choose or name a category')
    startTransition(async () => {
      const result = await receiveItem({
        variantSku: variant.sku,
        code,
        title,
        category,
        categoryName: categoryMode === 'new' ? newCategoryName : undefined,
        catalogNumber: form.get('catalogNumber'),
        maker: form.get('maker'),
        year: form.get('year'),
        condition: form.get('condition'),
        publish,
      })
      if (!result.success) return setError(result.error)
      router.push(result.id ? `/dashboard/platform/items/${result.id}` : '/dashboard/platform/items')
    })
  }

  return (
    <form action={submit} className="grid w-full max-w-3xl gap-8">
      <section>
        <SectionTitle meta={receivable.length}>Product variant</SectionTitle>
        <div className="grid gap-3">
          <Input
            type="search"
            placeholder="Search SKU or product"
            aria-label="Search SKU or product"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-h-10"
          />
          {receivable.length === 0 ? (
            <ListBand>
              <p className="px-4 py-3.5 text-sm text-muted-foreground">No product variants without an item</p>
            </ListBand>
          ) : (
            <ListBand className="max-h-80 overflow-y-auto">
              {receivable.map((v) => {
                const vPrice = v.prices?.find((p) => p.currency?.code?.toUpperCase() === currencyCode.toUpperCase())
                const selected = v.id === variantId
                return (
                  <label
                    key={v.id}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2.5 ${selected ? 'bg-background' : 'hover:bg-background/60'}`}
                  >
                    <input type="radio" name="variant" value={v.id} checked={selected} onChange={() => chooseVariant(v.id)} className="size-4" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="truncate text-sm font-medium text-foreground">{v.product?.title ?? v.title}</span>
                        <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
                          <Dot tone={v.product?.status === 'published' ? 'ok' : 'muted'} />
                          {v.product?.status === 'published' ? 'Published' : 'Not published'}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{v.sku}</span>
                    </div>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-foreground">
                      {vPrice ? money(vPrice.amount, currencyCode.toUpperCase()) : 'No price'}
                    </span>
                  </label>
                )
              })}
            </ListBand>
          )}
        </div>
      </section>

      <section>
        <SectionTitle>Item</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="rc-code">Item code *</Label>
            <Input id="rc-code" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={128} pattern="[A-Za-z0-9_-]+" className="min-h-10 font-mono" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rc-title">Title *</Label>
            <Input id="rc-title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={300} className="min-h-10" />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Category *</Label>
            <Track label="Category source" className="justify-self-start">
              <Pill active={categoryMode === 'existing'} disabled={!categories.length} onClick={() => setCategoryMode('existing')}>Existing</Pill>
              <Pill active={categoryMode === 'new'} onClick={() => setCategoryMode('new')}>New</Pill>
            </Track>
            {categoryMode === 'existing' ? (
              <select name="category" aria-label="Category" required className={selectCls} defaultValue="">
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.handle}>{c.name}</option>
                ))}
              </select>
            ) : (
              <div className="grid gap-1">
                <Input aria-label="New category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required maxLength={120} className="min-h-10" />
                {newCategoryName && <span className="font-mono text-xs text-muted-foreground">{slug(newCategoryName)}</span>}
              </div>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rc-catalog">Catalogue number</Label>
            <Input id="rc-catalog" name="catalogNumber" maxLength={120} className="min-h-10 font-mono" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rc-maker">Maker</Label>
            <Input id="rc-maker" name="maker" maxLength={200} className="min-h-10" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rc-year">Year</Label>
            <Input id="rc-year" name="year" inputMode="numeric" pattern="[0-9]{1,4}" maxLength={4} className="min-h-10 font-mono" />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="rc-condition">Condition *</Label>
            <Input id="rc-condition" name="condition" required maxLength={300} className="min-h-10" />
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>Listing</SectionTitle>
        <ListBand>
          <label className="flex min-h-12 items-center gap-3 px-4 py-2.5">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="size-4" />
            <span className="flex-1 text-sm text-foreground">Publish a fixed-price listing</span>
            <span className="font-mono text-xs tabular-nums text-foreground">
              {variant ? (price ? money(price.amount, currencyCode.toUpperCase()) : 'No price') : '—'}
            </span>
          </label>
        </ListBand>
      </section>

      {error && (
        <p role="alert" className="flex items-baseline gap-2 text-sm text-destructive">
          <Dot tone="danger" /> {error}
        </p>
      )}
      <Track label="Form actions" className="justify-self-start">
        <Pill type="submit" active disabled={pending}>{pending ? 'Receiving' : 'Receive item'}</Pill>
        <Pill onClick={() => router.push('/dashboard/platform/items')}>Cancel</Pill>
      </Track>
    </form>
  )
}
