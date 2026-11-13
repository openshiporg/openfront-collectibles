/**
 * Sidebar filtering from capabilities the session already has: the role's
 * canAccessDashboard flag and Keystone's per-session list `isHidden` from admin meta.
 * Plain module: no 'use server' / 'use client', no @/ imports.
 */

type SidebarList = { path: string; isHidden?: boolean | null }
type SidebarUser = { role?: { canAccessDashboard?: boolean | null } | null } | null | undefined

/** Only an explicit false hides navigation; an unknown user is left to the middleware. */
export function canUseDashboardNav(user: SidebarUser) {
  return user?.role?.canAccessDashboard !== false
}

export function visibleSidebarLists<T extends SidebarList>(lists: T[], user: SidebarUser): T[] {
  if (!canUseDashboardNav(user)) return []
  return lists.filter((list) => !list.isHidden)
}

/** Platform pages whose data lives in a list with a different path; the page follows that list's visibility. */
export const PLATFORM_PAGE_LIST: Record<string, string> = {
  analytics: 'orders',
  markets: 'regions',
  store: 'stores',
  cards: 'collectible-sets',
  graded: 'specimens',
  sealed: 'catalog-items',
  pricing: 'pricing-rules',
  buylist: 'buylists',
  'trade-ins': 'trade-in-submissions',
  consignments: 'consignment-intakes',
  consignment: 'consignment-settlements',
  items: 'specimens',
  catalog: 'catalog-items',
  'collectible-inventory': 'inventory-units',
  evidence: 'evidence-attachments',
  disputes: 'dispute-cases',
  'high-value-fulfillment': 'fulfillment-requirements',
  'collectible-commerce': 'listings',
  auctions: 'auctions',
  collectors: 'collector-profiles',
  sellers: 'seller-profiles',
  apps: 'oauth-apps',
  'order-management-system': 'oauth-apps',
  claims: 'claim-orders',
  inventory: 'product-variants',
  'regions-management': 'regions',
  shipping: 'shipping-providers',
  system: 'stores',
}

/**
 * A platform page whose first segment is a list path follows that list's visibility;
 * pages that are not tied to one list stay visible to dashboard users.
 */
export function visiblePlatformItems<T extends { href: string }>(
  items: T[],
  lists: SidebarList[],
  user: SidebarUser
): T[] {
  if (!canUseDashboardNav(user)) return []
  const hiddenPaths = new Set(lists.filter((list) => list.isHidden).map((list) => list.path))
  return items.filter((item) => {
    const slug = item.href.split('/platform/')[1]?.split(/[/?#]/)[0]
    return !slug || (!hiddenPaths.has(slug) && !hiddenPaths.has(PLATFORM_PAGE_LIST[slug] ?? slug))
  })
}
