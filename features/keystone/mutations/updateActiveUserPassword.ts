import { requireHumanOwnerId } from '../security/customer-personalization-owner';
import type { Context } from '.keystone/types';

type PasswordArgs = { oldPassword: string; newPassword: string; confirmPassword: string };
type AuthenticationResult = {
  authenticateUserWithPassword: { __typename: string; item?: { id: string } | null } | null;
};
export default async function updateActiveUserPassword(
  _root: unknown, { oldPassword, newPassword, confirmPassword }: PasswordArgs, context: Context,
) {
  requireHumanOwnerId(context.session);
  const session = context.session;
  if (!session?.itemId) throw new Error('Not authenticated');
  if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
  const existingUser = await context.sudo().query.User.findOne({ where: { id: session.itemId }, query: 'id email' });
  if (!existingUser) throw new Error('User not found');
  const result = await context.graphql.raw<AuthenticationResult, { email: string; password: string }>({
    query: `mutation VerifyPassword($email: String!, $password: String!) {
      authenticateUserWithPassword(email: $email, password: $password) {
        __typename
        ... on UserAuthenticationWithPasswordSuccess { item { id } }
      }
    }`,
    variables: { email: existingUser.email, password: oldPassword },
  });
  const authentication = result.data?.authenticateUserWithPassword;
  if (result.errors?.length || authentication?.__typename !== 'UserAuthenticationWithPasswordSuccess' || authentication.item?.id !== session.itemId) throw new Error('Invalid old password');
  // Only the authenticated owner, after old-password proof, reaches the bypass.
  return context.sudo().db.User.updateOne({ where: { id: session.itemId }, data: { password: newPassword } });
}
