'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateOrderStatus } from '../actions/orders'

/** Cancels an order with nothing left to collect. The server restocks its items once. */
export function CancelOrderDialog({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <DialogTrigger asChild><Button type="button" variant="outline" size="sm">Cancel order</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel order</DialogTitle>
          <DialogDescription>The order closes and its items go back to stock. Listings are paused so you choose when to relist.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={async (event) => {
          event.preventDefault()
          if (!reason.trim()) { setError('Enter a reason.'); return }
          setBusy(true); setError('')
          try {
            const result = await updateOrderStatus(orderId, 'canceled', reason.trim())
            if (!result.success) { setError(result.error || 'The order could not be canceled.'); return }
            setOpen(false); router.refresh()
          } catch { setError('The order could not be canceled.') }
          finally { setBusy(false) }
        }}>
          <div className="space-y-2"><Label htmlFor="cancel-reason">Reason</Label><Textarea id="cancel-reason" value={reason} maxLength={1000} disabled={busy} onChange={(e) => setReason(e.target.value)} required /></div>
          {error && <p role="alert" className="text-sm text-destructive break-words">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Keep order</Button><Button type="submit" variant="destructive" disabled={busy}>{busy ? 'Canceling…' : 'Cancel order'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
