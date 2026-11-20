import type { Metadata } from "next";
import { AccountPageLayout } from "@/features/storefront/screens/AccountDashboardPage";
import { getStore } from "@/features/storefront/lib/data/store";

// The @login/@dashboard parallel slots drop the storefront title template, so carry it here.
export async function generateMetadata(): Promise<Metadata> {
  const name = (await getStore())?.name || "Card shop";
  return { title: { template: `%s | ${name}`, default: `Account | ${name}` } };
}

export default AccountPageLayout;
