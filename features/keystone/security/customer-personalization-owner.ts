import { isMachinePrincipal } from "./principal";

type HumanOwnerSession = { itemId: string };

export function isHumanOwnerSession(
  session: unknown,
): session is HumanOwnerSession {
  if (!session || typeof session !== "object" || isMachinePrincipal(session)) {
    return false;
  }
  const itemId = (session as { itemId?: unknown }).itemId;
  return typeof itemId === "string" && itemId.length > 0;
}

export function requireHumanOwnerId(session: unknown): string {
  if (!isHumanOwnerSession(session)) {
    throw new Error("An authenticated human owner is required");
  }
  return session.itemId;
}

export function customerOwnerFilter({ session }: { session?: unknown }) {
  if (!isHumanOwnerSession(session)) return false;
  return { user: { id: { equals: session.itemId } } };
}
