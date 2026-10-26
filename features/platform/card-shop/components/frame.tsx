import type { ReactNode } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/features/dashboard/components/PageContainer';
import { PageTitle } from '@/features/platform/components/vault-ui';

/** Card-shop desk frame: the shared page container, a title line, and a `tc` scope for the card slice. */
export function DeskFrame({
  title,
  meta,
  actions,
  crumbs = [],
  children,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  crumbs?: Array<{ label: string; href?: string }>;
  children: ReactNode;
}) {
  return (
    <PageContainer
      title={title}
      breadcrumbs={[
        { type: 'link', label: 'Dashboard', href: '/dashboard' },
        { type: 'page', label: 'Platform' },
        ...crumbs.map((c) => (c.href ? { type: 'link' as const, label: c.label, href: c.href } : { type: 'page' as const, label: c.label })),
        { type: 'page', label: title },
      ]}
    >
      <div className="tc w-full max-w-6xl space-y-8 px-4 pb-28 md:px-6 md:pb-12">
        <PageTitle title={title} meta={meta} actions={actions} />
        {children}
      </div>
    </PageContainer>
  );
}

/** Square, quiet secondary link for desk headers. */
export function DeskLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-9 items-center border border-border px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted max-sm:min-h-10">
      {children}
    </Link>
  );
}

export function DeskError({ message }: { message: string }) {
  return <p role="alert" className="border border-destructive/40 px-4 py-3 text-sm text-destructive">{message}</p>;
}

export function DeskEmpty({ children }: { children: ReactNode }) {
  return <p className="border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

export function DeskSection({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {meta ? <span className="text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}
