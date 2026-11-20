import type { Metadata } from "next";
import { getStore } from "@/features/storefront/lib/data/store";

// Every storefront tab reads "<page> | <store name>"; the home page sets an absolute title.
export async function generateMetadata(): Promise<Metadata> {
  const name = (await getStore())?.name || "Card shop";
  return { title: { template: `%s | ${name}`, default: name } };
}

export default function StorefrontCountryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
