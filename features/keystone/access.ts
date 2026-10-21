import { permissionsList } from "./models/fields";
import { SCOPE_TO_PERMISSIONS, OAuthScope } from "./oauth/scopes";
import { isMachinePrincipal } from "./security/principal";

type PermissionAccessArgs = { session?: any };

// At it's simplest, the access control returns a yes or no value depending on the users session

export function isSignedIn({ session }: { session?: any }) {
  return !!session;
}

// Helper function to check if OAuth scopes grant a permission
function hasOAuthPermission(session: any, permission: string): boolean {
  if (!Array.isArray(session?.oauthScopes)) return false;
  
  const scopes = session.oauthScopes as OAuthScope[];
  const grantedPermissions = new Set<string>();
  
  scopes.forEach(scope => {
    const scopePermissions = SCOPE_TO_PERMISSIONS[scope];
    if (scopePermissions) {
      scopePermissions.forEach(p => grantedPermissions.add(p));
    }
  });
  
  return grantedPermissions.has(permission);
}

// Helper function to check if API key scopes grant a permission
function hasApiKeyPermission(session: any, permission: string): boolean {
  if (!Array.isArray(session?.apiKeyScopes)) return false;
  
  const scopes = session.apiKeyScopes as OAuthScope[]; // API keys use same scope format as OAuth
  const grantedPermissions = new Set<string>();
  
  scopes.forEach(scope => {
    const scopePermissions = SCOPE_TO_PERMISSIONS[scope];
    if (scopePermissions) {
      scopePermissions.forEach(p => grantedPermissions.add(p));
    }
  });
  
  return grantedPermissions.has(permission);
}

const generatedPermissions = Object.fromEntries(
  permissionsList.map((permission) => [
    permission,
    function ({ session }: { session?: any }) {
      // Check API key scopes first
      if (hasApiKeyPermission(session, permission)) {
        return true;
      }
      
      // Check OAuth scopes second
      if (hasOAuthPermission(session, permission)) {
        return true;
      }
      
      // Machine credentials are attenuated principals: their owner’s role is not
      // an additional grant. Empty or unknown scopes therefore grant nothing.
      if (isMachinePrincipal(session)) return false;

      return !!session?.data?.role?.[permission];
    },
  ])
);


// Permissions check if someone meets a criteria - yes or no.
export const permissions = {
  ...generatedPermissions,
};

// Rule based function
// Rules can return a boolean - yes or no - or a filter which limits which products they can CRUD.
export const rules = {
  canManageOrders({ session }: PermissionAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canManageProducts({ session })) {
      return true;
    }
    // 2. If not, do they own this item?
    // return { user: { id: { equals: session?.itemId } } };
  },
  canManageProducts({ session }: PermissionAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canManageProducts({ session })) {
      return true;
    }
    // 2. If not, do they own this item?
    // return { user: { id: { equals: session?.itemId } } };
  },
  canManageOrderItems({ session }: PermissionAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canManageCart({ session })) {
      return true;
    }
    // 2. If not, do they own this item?
    // return { order: { user: { id: { equals: session?.itemId } } } };
  },
  canReadProducts({ session }: PermissionAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageProducts({ session })) {
      return true; // They can read everything!
    }
    // They should only see available products (based on the status field)
    // return { status: { equals: "AVAILABLE" } };
  },
  canManageUsers({ session }: PermissionAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    // Otherwise they may only update themselves!
    return { id: { equals: session?.itemId } };
  },

  canManageKeys({ session }: { session?: unknown }) {
    if (!isSignedIn({ session }) || isMachinePrincipal(session)) {
      return { id: { equals: '__api_key_access_denied__' } };
    }
    if (permissions.canManageKeys({ session })) {
      return {};
    }
    // Otherwise they may only manage their own API keys
    const itemId = (session as { itemId?: string } | undefined)?.itemId;
    return { user: { id: { equals: itemId } } };
  },
};
