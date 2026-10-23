import { StoreOrder } from "@/features/storefront/types/storefront"
import CartTotals from "@/features/storefront/modules/common/components/cart-totals"
import OrderSection from "../section"

type OrderSummaryProps = {
  order: StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  return (
    <OrderSection title="Totals">
      <CartTotals
        data={{
          subtotal: order.subtotal,
          discount: order.discount ? order.discount : null,
          giftCardTotal: order.giftCard || null,
          shipping: order.shipping,
          tax: order.tax,
          total: order.total,
        }}
      />
    </OrderSection>
  )
}

export default OrderSummary
