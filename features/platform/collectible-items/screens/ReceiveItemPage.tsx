import { PageContainer } from '../../../dashboard/components/PageContainer'
import { Dot, ListBand, PageTitle } from '../../components/vault-ui'
import { getReceiveOptions } from '../actions'
import { ReceiveItemForm } from '../components/ReceiveItemForm'

export async function ReceiveItemPage() {
  const options = await getReceiveOptions()
  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: '/dashboard' },
    { type: 'link' as const, label: 'Items', href: '/dashboard/platform/items' },
    { type: 'page' as const, label: 'Receive' },
  ]

  return (
    <PageContainer title="Receive item" header={<PageTitle title="Receive item" />} breadcrumbs={breadcrumbs}>
      <div className="px-4 pb-28 md:px-6 md:pb-12">
        {options.success ? (
          <ReceiveItemForm
            initialVariants={options.data.productVariants}
            categories={options.data.collectibleCategories.filter((c: any) => c.status !== 'archived')}
            currencyCode={options.data.stores[0]?.defaultCurrencyCode || 'USD'}
          />
        ) : (
          <ListBand>
            <p role="alert" className="flex items-baseline gap-2 px-4 py-3.5 text-sm text-muted-foreground">
              <Dot tone="danger" /> {options.error}
            </p>
          </ListBand>
        )}
      </div>
    </PageContainer>
  )
}

export default ReceiveItemPage
