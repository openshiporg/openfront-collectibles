"use client"

import { useActionState } from "react"

import { saveCollectorProfile } from "@/features/storefront/lib/data/collectibles"
import StatusDot from "@/features/storefront/modules/common/components/collectibles/status-dot"

type Profile = { id: string; displayName: string; interests?: unknown; public?: boolean } | null

const field =
  "min-h-12 w-full rounded-[2px] border border-cx-line bg-cx-surface px-4 text-[15px] text-cx-ink placeholder:text-cx-ink-3 focus:outline-2 focus:outline-cx-accent"

export default function CollectorProfileForm({ profile, fallbackName }: { profile: Profile; fallbackName: string }) {
  const [state, action, pending] = useActionState(saveCollectorProfile, {} as { success?: boolean; error?: string })
  const interests = Array.isArray(profile?.interests) ? (profile!.interests as unknown[]).filter((v) => typeof v === "string").join(", ") : ""

  return (
    <form action={action} className="space-y-4 px-4 py-5 sm:px-5" data-testid="collector-profile-form">
      {profile?.id && <input type="hidden" name="id" value={profile.id} />}
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="font-cx-serif text-[20px] leading-[26px] text-cx-ink">Collector profile</h2>
        <span className="inline-flex items-baseline gap-1.5 text-[13px] text-cx-ink-2">
          <StatusDot tone={profile ? (profile.public ? "ok" : "muted") : "muted"} />
          {profile ? (profile.public ? "Public" : "Private") : "Not set up"}
        </span>
      </div>
      <label className="block space-y-1.5">
        <span className="text-[13px] text-cx-ink-2">Display name</span>
        <input name="displayName" className={field} maxLength={120} required defaultValue={profile?.displayName ?? fallbackName} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-[13px] text-cx-ink-2">Interests, comma separated</span>
        <input name="interests" className={field} maxLength={1200} defaultValue={interests} />
      </label>
      <label className="flex min-h-11 items-center gap-3 text-[14px] text-cx-ink">
        <input type="checkbox" name="public" defaultChecked={!!profile?.public} className="size-5 accent-[hsl(var(--cx-h,26)_64%_34%)]" />
        Public profile
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="cx-btn" disabled={pending} data-testid="save-collector-profile">
          {pending ? "Saving" : profile ? "Save profile" : "Create profile"}
        </button>
        {state.success && (
          <span className="inline-flex items-baseline gap-1.5 text-[14px] text-cx-ink-2" role="status">
            <StatusDot tone="ok" />
            Saved
          </span>
        )}
        {state.error && (
          <span className="text-[14px] text-cx-danger" role="alert">
            {state.error}
          </span>
        )}
      </div>
    </form>
  )
}
