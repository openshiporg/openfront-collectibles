export function isMachinePrincipal(session: any): boolean {
  return Array.isArray(session?.apiKeyScopes) || Array.isArray(session?.oauthScopes);
}
