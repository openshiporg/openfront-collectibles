import Footer from "@/features/storefront/modules/layout/templates/footer"
import Nav from "@/features/storefront/modules/layout/templates/nav"
import { Metadata } from "next"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import CollectiblesShell from "@/features/storefront/modules/layout/components/collectibles-shell"
import StorefrontServer from "./StorefrontServer"

export async function MainLayout({ children }: { children: React.ReactNode }) {

  return (
    <StorefrontServer
      prefetchUser={true}
      prefetchCart={true}
      prefetchCollections={true}
      prefetchCategories={true}
    >
      <CollectiblesShell>
        <Nav />
        <main className="min-h-[60vh] flex-1">{children}</main>
        <Footer />
      </CollectiblesShell>
    </StorefrontServer>
  )
}

export const MainNotFoundMetadata: Metadata = {
  title: "Page not found",
}

export function MainNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] flex-col justify-center gap-5 px-4 py-24 sm:px-6">
      <span className="cx-num text-[13px] text-cx-ink-3">404</span>
      <h1 className="font-cx-serif text-[40px] leading-[44px] tracking-[-0.015em] text-cx-ink sm:text-[56px] sm:leading-[58px]">
        Page not found
      </h1>
      <div className="mt-2">
        <LocalizedClientLink href="/store" className="cx-btn">
          Browse all items
        </LocalizedClientLink>
      </div>
    </div>
  )
}
