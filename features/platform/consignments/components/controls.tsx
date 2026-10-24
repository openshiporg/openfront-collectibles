'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pill, Track } from '@/features/platform/components/vault-ui';
import { cn } from '@/lib/utils';

type ActionResult = { success: true } | { success: false; error: string };

export const fieldClass =
  'min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring max-sm:min-h-11';

/** Lifecycle actions as raised pills in one recessed track; refreshes on success. */
export function MovePills({
  label,
  moves,
  onMove,
}: {
  label: string;
  moves: { to: string; label: string }[];
  onMove: (to: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  if (!moves.length) return null;
  return (
    <div className="space-y-1.5">
      <Track label={label}>
        {moves.map((move) => (
          <Pill
            key={move.to}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError('');
                const result = await onMove(move.to);
                if (result.success) router.refresh();
                else setError(result.error);
              })
            }
          >
            {move.label}
          </Pill>
        ))}
      </Track>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** A dialog with a form; submits FormData to a server action and refreshes. */
export function FormDialog({
  trigger,
  title,
  description,
  submitLabel,
  onSubmit,
  children,
  triggerClassName,
}: {
  trigger: string;
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (form: FormData) => Promise<ActionResult & { redirectTo?: string }>;
  children: ReactNode;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); setError(''); }}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex min-h-9 items-center gap-1.5 rounded-full bg-background px-3.5 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.08)] hover:bg-muted max-sm:min-h-10 dark:bg-zinc-800 dark:hover:bg-zinc-700',
            triggerClassName,
          )}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {trigger}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          action={(form) =>
            startTransition(async () => {
              setError('');
              const result = await onSubmit(form);
              if (!result.success) return setError(result.error);
              setOpen(false);
              if (result.redirectTo) router.push(result.redirectTo);
              else router.refresh();
            })
          }
        >
          {children}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Track label="Form actions" className="justify-self-start">
            <Pill type="submit" active disabled={pending}>{pending ? 'Saving' : submitLabel}</Pill>
            <Pill onClick={() => setOpen(false)} disabled={pending}>Cancel</Pill>
          </Track>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
