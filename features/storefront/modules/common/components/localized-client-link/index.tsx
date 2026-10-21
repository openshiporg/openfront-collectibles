'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };
export default function LocalizedClientLink({ href, children, ...props }: Props) {
  const params = useParams();
  const country = typeof params?.countryCode === 'string' && /^[a-z]{2}$/i.test(params.countryCode) ? params.countryCode.toLowerCase() : '';
  const prefix = country ? `/${country}` : '';
  const alreadyLocalized = href === prefix || href.startsWith(`${prefix}/`);
  const target = prefix && href.startsWith('/') && !href.startsWith('//') && !alreadyLocalized ? `${prefix}${href}` : href;
  return <Link href={target} {...props}>{children}</Link>;
}
