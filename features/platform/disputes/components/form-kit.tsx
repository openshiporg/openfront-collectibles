'use client';

import { useState, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Pill, Track } from '../../components/vault-ui';

export const inputCls =
  'min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring';

export function Field({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Opens a right-hand sheet with a form; `onSubmit` returns an error message or nothing. */
export function FormSheet({
  trigger,
  title,
  description,
  submitLabel,
  onSubmit,
  children,
}: {
  trigger: (open: () => void) => ReactNode;
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (form: FormData) => Promise<string | void>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const failure = await onSubmit(new FormData(event.currentTarget));
      if (failure) setError(failure);
      else setOpen(false);
    } catch {
      setError('Request failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {trigger(() => setOpen(true))}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription className="sr-only">{description}</SheetDescription>
          </SheetHeader>
          <form onSubmit={submit} className="grid content-start gap-4 px-5 py-5">
            {children}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Track label="Form actions" className="justify-self-start">
              <Pill type="submit" active disabled={pending}>{pending ? 'Saving' : submitLabel}</Pill>
              <Pill onClick={() => setOpen(false)}>Cancel</Pill>
            </Track>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Raised pill that runs a server action and reports failure inline. */
export function useAction() {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  async function run(key: string, action: () => Promise<{ success: boolean; error?: string }>) {
    setPending(key);
    setError('');
    try {
      const result = await action();
      if (!result.success) setError(result.error || 'Request failed');
    } catch {
      setError('Request failed');
    } finally {
      setPending(null);
    }
  }
  return { pending, error, run };
}

export function ActionError({ error, className }: { error: string; className?: string }) {
  return error ? <p role="alert" className={cn('text-sm text-destructive', className)}>{error}</p> : null;
}
