import { Metadata } from "next"
import { getStore } from "@/features/storefront/lib/data/store"

import LoginTemplate from "@/features/storefront/modules/account/templates/login-template"

// The @login slot does not inherit the storefront title template, so name the store here.
export async function generateMetadata(): Promise<Metadata> {
  const name = (await getStore())?.name || "Card shop"
  return { title: { absolute: `Sign in | ${name}` }, description: "Sign in to your account." }
}

export function LoginPage() {
  return <LoginTemplate />
}
