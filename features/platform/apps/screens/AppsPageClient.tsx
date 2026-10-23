'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dot, ListBand, SectionTitle } from '../../components/vault-ui'
import { Loader2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateOAuthAppRedirectUris } from '../actions'
import { toast } from 'sonner'

interface ExistingApp {
  id: string
  name: string
  description?: string
  clientId: string
  redirectUris: string[]
  scopes: string[]
  status: 'active' | 'suspended'
}

interface AppsPageClientProps {
  existingApps: ExistingApp[]
}

function ExistingAppCard({
  app,
  onRedirectUrisUpdate,
}: {
  app: ExistingApp
  onRedirectUrisUpdate: (appId: string, redirectUris: string[]) => void
}) {
  const [showAddUrlDialog, setShowAddUrlDialog] = useState(false)
  const [newRedirectUrl, setNewRedirectUrl] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleAddRedirectUrl = async () => {
    const redirectUrl = newRedirectUrl.trim()
    if (!redirectUrl) return

    setIsUpdating(true)
    try {
      const updatedUris = [...(app.redirectUris || []), redirectUrl]
      const result = await updateOAuthAppRedirectUris(app.id, updatedUris)
      if (!result.success) {
        toast.error(result.error || 'Failed to add redirect URL')
        return
      }
      onRedirectUrisUpdate(app.id, updatedUris)
      setNewRedirectUrl('')
      setShowAddUrlDialog(false)
      toast.success('Redirect URL added successfully')
    } catch {
      toast.error('Failed to add redirect URL')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <div className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <Dot tone={app.status === 'active' ? 'ok' : 'danger'} />
            <h3 className="text-sm font-semibold text-foreground">{app.name}</h3>
            <span className="text-xs capitalize text-muted-foreground">{app.status}</span>
          </div>
          {app.description && (
            <p className="mt-1 text-sm text-muted-foreground">{app.description}</p>
          )}
          <dl className="mt-1 flex flex-wrap gap-x-1.5 text-xs">
            <dt className="text-muted-foreground">Client ID</dt>
            <dd className="break-all font-mono tabular-nums text-foreground">{app.clientId}</dd>
          </dl>
        </div>
        <div className="min-w-0">
          <span className="block text-xs text-muted-foreground">
            Redirect URLs <span className="font-mono tabular-nums">{(app.redirectUris || []).length}</span>
          </span>
          <ul className="mt-1 space-y-0.5">
            {(app.redirectUris || []).map((uri) => (
              <li key={uri} className="break-all font-mono text-xs text-foreground">{uri}</li>
            ))}
          </ul>
        </div>
        <Button
          variant="ghost"
          className="h-10 justify-self-start rounded-full bg-background px-4 text-[13px] shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.06)] sm:h-8 dark:bg-zinc-800"
          onClick={() => setShowAddUrlDialog(true)}
        >
          <Plus className="size-4" />
          Add redirect URL
        </Button>
      </div>

      <Dialog open={showAddUrlDialog} onOpenChange={setShowAddUrlDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add redirect URL</DialogTitle>
            <DialogDescription>{app.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor={`redirect-url-${app.id}`}>Redirect URL</Label>
            <Input
              id={`redirect-url-${app.id}`}
              value={newRedirectUrl}
              onChange={(event) => setNewRedirectUrl(event.target.value)}
              placeholder="https://example.com/api/oauth/callback"
              disabled={isUpdating}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="h-10 rounded-full bg-muted px-4"
              onClick={() => {
                setShowAddUrlDialog(false)
                setNewRedirectUrl('')
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button className="h-10 rounded-full px-4" onClick={handleAddRedirectUrl} disabled={isUpdating || !newRedirectUrl.trim()}>
              {isUpdating && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AppsPageClient({ existingApps = [] }: AppsPageClientProps) {
  const [apps, setApps] = useState(existingApps)
  const handleRedirectUrisUpdate = useCallback((appId: string, redirectUris: string[]) => {
    setApps((current) => current.map((app) => app.id === appId ? { ...app, redirectUris } : app))
  }, [])

  return (
    <div className="px-4 pb-6 md:px-6">
      <SectionTitle meta={apps.length}>OAuth applications</SectionTitle>
      {apps.length === 0 ? (
        <ListBand>
          <div className="px-4 py-3 text-sm text-muted-foreground">No OAuth applications</div>
        </ListBand>
      ) : (
        <ListBand>
          {apps.map((app) => (
            <ExistingAppCard
              key={app.id}
              app={app}
              onRedirectUrisUpdate={handleRedirectUrisUpdate}
            />
          ))}
        </ListBand>
      )}
    </div>
  )
}
