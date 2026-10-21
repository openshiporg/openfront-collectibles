import { permissions } from "../access";
import { isMachinePrincipal } from "./principal";

// Raw CartCreateInput can contain nested relationship graphs. Keep that path
// available to human order managers only; customer and machine callers use the
// narrower, proof-issuing createActiveCart command instead.
export const canCreateRawCart = (
  args: Parameters<typeof permissions.canManageOrders>[0],
) =>
  !isMachinePrincipal(args.session) && permissions.canManageOrders(args);
