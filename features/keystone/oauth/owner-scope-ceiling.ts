import { SCOPE_TO_PERMISSIONS, type OAuthScope } from './scopes';

export function attenuateScopesToOwnerRole(scopes: unknown, role: unknown): OAuthScope[] {
  if (!Array.isArray(scopes) || !role || typeof role !== 'object') return [];
  const owner = role as Record<string, unknown>;
  return [...new Set(scopes.filter((scope): scope is OAuthScope =>
    typeof scope === 'string' &&
    Object.prototype.hasOwnProperty.call(SCOPE_TO_PERMISSIONS, scope) &&
    SCOPE_TO_PERMISSIONS[scope as OAuthScope].every((permission) => owner[permission] === true),
  ))];
}

export function ownerRoleAllowsScope(scope: unknown, role: unknown): scope is OAuthScope {
  return attenuateScopesToOwnerRole([scope], role).length === 1;
}
