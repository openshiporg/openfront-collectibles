import { requireHumanOwnerId } from '../security/customer-personalization-owner';
import type { Context, UserUpdateProfileInput } from '.keystone/types';
import { permissions } from "../access";

const ONBOARDING_STATUSES = new Set([
  "not_started",
  "in_progress",
  "completed",
  "dismissed",
]);

async function updateActiveUser(root: unknown, { data }: { data: UserUpdateProfileInput; oldPassword?: undefined }, context: Context) {
  // Check if user is authenticated
  requireHumanOwnerId(context.session);
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("Not authenticated");
  }

  // Profile edits remain session-owner scoped, but onboarding state is an
  // operator workflow field rather than a self-service profile field.
  const changesOnboardingStatus =
    data && Object.prototype.hasOwnProperty.call(data, "onboardingStatus");
  if (changesOnboardingStatus) {
    if (!permissions.canManageOnboarding({ session })) {
      throw new Error("Not authorized to update onboarding status");
    }
    if (typeof data.onboardingStatus !== 'string' || !ONBOARDING_STATUSES.has(data.onboardingStatus)) {
      throw new Error("Invalid onboarding status");
    }
  }

  const sudoContext = context.sudo();

  // Get current user
  const existingUser = await sudoContext.query.User.findOne({
    where: { id: session.itemId }
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (data.password !== undefined) throw new Error('Use the password-change action with old-password proof');
  if (data.billingAddress !== undefined) throw new Error('Use the owned address action');
  const { password: _password, billingAddress: _billingAddress, ...profile } = data;

  // Update user
  return await sudoContext.db.User.updateOne({
    where: { id: session.itemId },
    data: profile,
  });
}

export default updateActiveUser; 