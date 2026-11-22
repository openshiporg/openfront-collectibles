import { Metadata } from "next"
import ResetPassword from "@/features/storefront/modules/account/components/reset-password"

export const metadata: Metadata = { title: "Reset password", description: "Choose a new password for your account." }

export async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const token = typeof params.token === "string" ? params.token : null
  const email = typeof params.email === "string" ? params.email : null
  return (
    <div className="flex w-full justify-center px-4 py-10 sm:py-16">
      <ResetPassword token={token} email={email} />
    </div>
  )
}
