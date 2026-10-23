import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"

interface CartTemplateProps {
  cart?: {
    id: string;
    lineItems: any[];
    region: any;
  };
  user: any;
}

const CartTemplate = ({ cart, user }: CartTemplateProps) => {
  const count = cart?.lineItems?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12" data-testid="cart-container">
      {cart?.lineItems?.length ? (
        <>
          <div className="flex items-baseline gap-3 border-b border-cx-line pb-4">
            <h1 className="font-cx-serif text-[36px] leading-[40px] tracking-[-0.015em] text-cx-ink sm:text-[48px] sm:leading-[52px]">
              Cart
            </h1>
            <span className="cx-num text-[13px] text-cx-ink-3">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
            <div className="flex min-w-0 flex-col gap-4">
              {!user && <SignInPrompt />}
              <ItemsTemplate items={cart.lineItems} region={cart.region} />
            </div>
            {cart.region && (
              <aside className="relative">
                <div className="lg:sticky lg:top-24">
                  <Summary cart={cart} />
                </div>
              </aside>
            )}
          </div>
        </>
      ) : (
        <EmptyCartMessage />
      )}
    </div>
  )
}

export default CartTemplate
