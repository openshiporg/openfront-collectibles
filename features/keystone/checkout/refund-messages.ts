// Fixed refund outcomes staff see. Plain module: the server rules and the refund dialog share it.

/** Final for its key: the dialog unlocks so staff can start a new refund. */
export const REFUND_DECLINED_MESSAGE = "The processor declined this refund, so nothing was refunded. Check the payment, then start a new refund.";
export const REFUND_NOT_CONFIRMED_MESSAGE = "The processor did not confirm this refund and nothing is held on the payment. Retry sends the same request again; if it fails again, close and start a new refund.";
export const REFUND_BALANCE_TAKEN_MESSAGE = "Another refund on this payment already used the remaining amount. Reload the order.";

export const FINAL_REFUND_MESSAGES = [REFUND_DECLINED_MESSAGE, REFUND_BALANCE_TAKEN_MESSAGE];
