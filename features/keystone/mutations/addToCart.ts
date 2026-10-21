// Retired starter CartItem endpoint: no CartItem exists in the current registry.
// Storefronts use owned active-cart commands, never this legacy raw CRUD path.
export default async function addToCart(_root: unknown, _args: unknown, _context: unknown): Promise<never> {
  throw new Error('Use the active-cart item command');
}
