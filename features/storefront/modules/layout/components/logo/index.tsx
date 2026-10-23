import { cn } from '@/lib/utils';
import LocalizedClientLink from '@/features/storefront/modules/common/components/localized-client-link';
import { getStore } from '@/features/storefront/lib/data/store';
import { storeBrand } from '@/features/storefront/lib/collectibles-brand';

export function LogoMark({ svg, color, className }: { svg: string; color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ filter: `hue-rotate(${color}deg)` }}
      className={cn('block shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full', className)}
    />
  );
}

export default async function Logo({ size = 'md', tone = 'ink' }: { size?: 'md' | 'lg'; tone?: 'ink' | 'paper' }) {
  const store = await getStore();
  const storeName = store?.name || 'Store';
  const { logoSvg, logoColor } = storeBrand(store);

  return (
    <LocalizedClientLink
      href="/"
      className={cn(
        'group inline-flex min-h-11 min-w-0 items-center gap-2.5',
        tone === 'paper' ? 'text-[#f3eee3]' : 'text-cx-ink'
      )}
      data-testid="nav-store-link"
    >
      <LogoMark svg={logoSvg} color={logoColor} className={size === 'lg' ? 'size-8' : 'size-6'} />
      <span
        className={cn(
          'truncate font-cx-serif leading-none tracking-[-0.01em]',
          size === 'lg' ? 'text-[26px]' : 'text-[20px]'
        )}
      >
        {storeName}
      </span>
    </LocalizedClientLink>
  );
}
