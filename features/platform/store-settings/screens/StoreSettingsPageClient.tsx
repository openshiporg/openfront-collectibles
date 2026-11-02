'use client';

import { useState } from 'react';
import { Code } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import { sanitizeStoreLogoSvg } from '@/features/lib/sanitize-store-logo';
import { PageTitle, Pill, Track, SectionTitle } from '@/features/platform/components/vault-ui';
import { storeBrand } from '@/features/storefront/lib/collectibles-brand';
import { LOGO_ICONS, HUE_PRESETS } from '../lib/icon-registry';
import { StoreSettingsSaveBar } from '../components/StoreSettingsSaveBar';
import { updateStoreSettings } from '../actions';

interface StoreSettingsPageClientProps {
  initialData: {
    id: string;
    name: string;
    logoIcon: string;
    logoColor: string;
    homepageTitle: string;
    homepageDescription: string;
  } | null;
  initialError: string | null;
}

export function StoreSettingsPageClient({ initialData, initialError }: StoreSettingsPageClientProps) {
  // What the storefront shows today: a store without a chosen registry mark gets the collectibles default.
  const live = storeBrand(initialData);
  const [name, setName] = useState(initialData?.name || '');
  const [logoIcon, setLogoIcon] = useState(live.logoSvg);
  const [logoColor, setLogoColor] = useState(live.logoColor);
  const [homepageTitle, setHomepageTitle] = useState(initialData?.homepageTitle || '');
  const [homepageDescription, setHomepageDescription] = useState(initialData?.homepageDescription || '');
  const [isLoading, setIsLoading] = useState(false);
  const safeLogo = sanitizeStoreLogoSvg(logoIcon);
  const selectedIcon = LOGO_ICONS.find((icon) => icon.lightSvg === logoIcon);

  const handleSave = async () => {
    if (!initialData?.id) {
      toast.error('No store found to update');
      return;
    }
    if (logoIcon.trim() && !safeLogo) {
      toast.error('Logo must be a valid, safe SVG document');
      return;
    }
    setIsLoading(true);
    const result = await updateStoreSettings(initialData.id, {
      name,
      logoIcon,
      logoColor,
      homepageTitle,
      homepageDescription,
    });
    if (result.success) toast.success('Store settings saved');
    else toast.error(result.error || 'Store settings not saved');
    setIsLoading(false);
  };

  if (initialError) {
    return (
      <div className="px-4 py-6 md:px-6">
        <p role="alert" className="text-sm text-destructive">{initialError}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-8 px-4 pb-24 pt-4 md:px-6 md:pb-10">
      <PageTitle
        title="Store settings"
        actions={
          <StoreSettingsSaveBar
            isSaving={isLoading}
            button={
              <Track label="Save">
                <Pill active onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Saving' : 'Save'}
                </Pill>
              </Track>
            }
          />
        }
      />

      <div className="grid gap-8">
        <div className="min-w-0 space-y-8">
          <section className="space-y-4">
            <SectionTitle>Store</SectionTitle>
            <div className="grid gap-1.5">
              <Label htmlFor="store-name">Store name</Label>
              <Input id="store-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="homepage-title">Homepage title</Label>
              <Input id="homepage-title" value={homepageTitle} onChange={(e) => setHomepageTitle(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="homepage-description">Homepage description</Label>
              <Textarea
                id="homepage-description"
                value={homepageDescription}
                onChange={(e) => setHomepageDescription(e.target.value)}
                className="min-h-20"
              />
            </div>
          </section>

          <section className="space-y-6">
            <SectionTitle>Logo</SectionTitle>
            {/* Logo Icon Selector */}
            <div>
              <Label>Logo Icon</Label>
              <div className="mt-2 flex items-center gap-2">
                <Select
                  value={selectedIcon?.id || ''}
                  onValueChange={(id) => {
                    const icon = LOGO_ICONS.find((i) => i.id === id);
                    if (icon) setLogoIcon(icon.lightSvg);
                  }}
                >
                  <SelectPrimitive.Trigger
                    className={cn(
                      'flex h-12 w-12 shrink-0 rounded-lg border border-input bg-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 p-0 overflow-hidden items-center justify-center'
                    )}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: logoIcon }}
                      style={{ filter: `hue-rotate(${logoColor}deg)` }}
                      className="[&>svg]:w-6 [&>svg]:h-6"
                    />
                  </SelectPrimitive.Trigger>
                  <SelectContent className="border-border dark:border-blue-700">
                    {LOGO_ICONS.map((icon) => (
                      <SelectItem key={icon.id} value={icon.id}>
                        <span className="flex items-center gap-3">
                          <div
                            dangerouslySetInnerHTML={{ __html: icon.lightSvg }}
                            style={{ filter: `hue-rotate(${logoColor}deg)` }}
                            className="[&>svg]:w-6 [&>svg]:h-6"
                          />
                          <span>
                            <span className="block font-medium text-gray-900 dark:text-gray-100">
                              {icon.name}
                            </span>
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* SVG Code Editor Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 shrink-0"
                      type="button"
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(500px,calc(100vw-2rem))]" align="start">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Edit SVG Code</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Edit the SVG code directly. Changes will be reflected in the icon preview.
                        </p>
                      </div>
                      <Textarea
                        value={logoIcon}
                        onChange={(e) => setLogoIcon(e.target.value)}
                        className="font-mono text-xs min-h-[300px]"
                        placeholder="<svg>...</svg>"
                      />
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">Preview:</div>
                        <div
                          dangerouslySetInnerHTML={{ __html: logoIcon }}
                          style={{ filter: `hue-rotate(${logoColor}deg)` }}
                          className="[&>svg]:w-8 [&>svg]:h-8 flex items-center justify-center p-2 border rounded"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Logo Color Selector */}
            <div>
              <Label>Logo Color</Label>
              <div className="mt-2">
                <Select
                  value={logoColor}
                  onValueChange={(value) => setLogoColor(value)}
                >
                  <SelectPrimitive.Trigger
                    className={cn(
                      'flex h-12 w-12 shrink-0 rounded-lg border border-input bg-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 p-0 overflow-hidden items-center justify-center'
                    )}
                  >
                    <SelectValue>
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{
                          background: `hsl(${(240 + parseInt(logoColor)) % 360}, 70%, 50%)`
                        }}
                      />
                    </SelectValue>
                  </SelectPrimitive.Trigger>
                  <SelectContent className="border-border dark:border-blue-700">
                    <div className="grid grid-cols-4 gap-2 p-2">
                      {HUE_PRESETS.map((preset) => (
                        <SelectItem
                          key={preset.value}
                          value={preset.value.toString()}
                          className="cursor-pointer p-0 h-12 w-12 flex items-center justify-center [&>span:first-child]:hidden"
                        >
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{
                              background: `hsl(${(240 + preset.value) % 360}, 70%, 50%)`
                            }}
                          />
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
