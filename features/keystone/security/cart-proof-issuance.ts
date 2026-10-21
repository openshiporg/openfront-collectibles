import { isMachinePrincipal } from './principal';

export function canIssueOwnedCartProof(session: any, cart: any): boolean {
  return Boolean(
    session?.itemId &&
    !isMachinePrincipal(session) &&
    cart?.user?.id === session.itemId &&
    !cart?.order?.id,
  );
}
