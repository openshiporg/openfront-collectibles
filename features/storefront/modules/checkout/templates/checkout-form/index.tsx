import Addresses from "@/features/storefront/modules/checkout/components/addresses";
import Shipping from "@/features/storefront/modules/checkout/components/shipping";
import Payment from "@/features/storefront/modules/checkout/components/payment";
import Review from "@/features/storefront/modules/checkout/components/review";
import { listCartPaymentMethods } from "@/features/storefront/lib/data/payment";
import { getCartShippingOptions } from "@/features/storefront/lib/data/shipping";

interface CheckoutFormProps {
  cart: {
    id: string;
    region: {
      id: string;
    };
    total: number;
    shippingMethods: any[];
    paymentCollection?: {
      paymentSessions?: Array<{
        isSelected: boolean;
        status?: string;
        paymentProvider: {
          code: string;
        };
      }>;
    };
    giftCards?: any[];
    shippingAddress: any;
    billingAddress: any;
    email: string;
    shipping: string;
  };
  customer: any;
}

export default async function CheckoutForm({ cart, customer }: CheckoutFormProps) {
  if (!cart) {
    return null;
  }

  // get available shipping methods and payment methods
  const availableShippingMethods = await getCartShippingOptions(cart.id);
  const availablePaymentMethods = await listCartPaymentMethods(cart.region.id);

  if (!availableShippingMethods || !availablePaymentMethods) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Addresses cart={cart} customer={customer} />
      <Shipping cart={cart} availableShippingMethods={availableShippingMethods} />
      <Payment cart={cart} availablePaymentMethods={availablePaymentMethods} />
      <Review cart={cart} />
    </div>
  );
}
