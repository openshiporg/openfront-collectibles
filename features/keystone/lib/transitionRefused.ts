import { GraphQLError } from "graphql";

// A lifecycle rule refused the move (refund a canceled return, cancel a fulfilled order,
// pay a trade-in twice). A plain Error is masked as "Unexpected error." by Yoga, so staff
// never saw why. Only for fixed, rule-written text: never provider output, ids or secrets.
export const TRANSITION_REFUSED = "TRANSITION_REFUSED";

export function transitionRefused(message: string) {
  return new GraphQLError(message, { extensions: { code: TRANSITION_REFUSED } });
}
