'use server'

import { revalidatePath } from 'next/cache'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'

export async function refundOrderPaymentAction(input: {
  orderId: string; paymentId: string; amount: number; reason: string; idempotencyKey: string; restock?: boolean
}) {
  const response = await keystoneClient(
    `mutation RefundOrderPayment($orderId: ID!, $paymentId: ID!, $amount: Int!, $reason: String!, $idempotencyKey: String!, $restock: Boolean) {
      refundOrderPayment(orderId: $orderId, paymentId: $paymentId, amount: $amount, reason: $reason, idempotencyKey: $idempotencyKey, restock: $restock) { id amount metadata }
    }`, input
  )
  if (response.success) {
    for (const path of [`/dashboard/platform/orders/${input.orderId}`, '/dashboard/platform/orders', '/dashboard/platform/payments', '/dashboard/platform/refunds']) revalidatePath(path)
  }
  if (!response.success) return response
  const refund = response.data?.refundOrderPayment
  const restock = refund?.metadata?.restock as { restocked?: boolean; reason?: string } | undefined
  return {
    success: true as const,
    data: { refundOrderPayment: { id: refund?.id, amount: refund?.amount } },
    restock: restock && input.restock ? { restocked: !!restock.restocked, reason: restock.reason } : undefined,
  }
}

/** "Check with processor": records refunds the processor made and frees amounts held by refund calls it never confirmed. */
export async function reconcileOrderRefundsAction(orderId: string) {
  const response = await keystoneClient(
    `mutation ReconcileOrderRefunds($orderId: ID!) { reconcileOrderRefunds(orderId: $orderId) }`,
    { orderId }
  )
  if (!response.success) return response
  for (const path of [`/dashboard/platform/orders/${orderId}`, '/dashboard/platform/orders', '/dashboard/platform/payments', '/dashboard/platform/refunds']) revalidatePath(path)
  const result = (response.data?.reconcileOrderRefunds || {}) as { recorded?: number; released?: number }
  return { success: true as const, recorded: Number(result.recorded) || 0, released: Number(result.released) || 0 }
}
