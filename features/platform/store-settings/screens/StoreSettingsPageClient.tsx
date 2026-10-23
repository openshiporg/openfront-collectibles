'use client';

import { useState } from 'react';
import { Code } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { sanitizeStoreLogoSvg } from '@/features/lib/sanitize-store-logo';
import { PageTitle, Pill, Track, SectionTitle, pillClass } from '@/features/platform/components/vault-ui';
import { storeBrand } from '@/features/storefront/lib/collectibles-brand';
import { LOGO_ICONS, HUE_PRESETS } from '../lib/icon-registry';
import { HueSlider } from '../components/HueSlider';
import { updateStoreSettings } from '../actions';

// Registry marks are drawn at hue 221; the storefront accent is that hue after rotation.
const REGISTRY_BASE_HUE = 221;
const HUES: Array<{ name: string; value: number }> = [{ name: "Bronze", value: 165 }, ...HUE_PRESETS];

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

function MarkTile({ svg, rotation, className }: { svg: string; rotation: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ filter: `hue-rotate(${rotation}deg)` }}
      className={cn('block shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full', className)}
    />
  );
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
  const rotation = Number.parseFloat(logoColor) || 0;
  const accentHue = (((REGISTRY_BASE_HUE + rotation) % 360) + 360) % 360;
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
    <div className="w-full max-w-6xl space-y-8 px-4 pb-10 pt-4 md:px-6">
      <PageTitle
        title="Store settings"
        actions={
          <Track label="Save">
            <Pill active onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving' : 'Save'}
            </Pill>
          </Track>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
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

          <section className="space-y-3">
            <SectionTitle meta={selectedIcon?.name ?? 'Custom'}>Mark</SectionTitle>
            <div
              role="radiogroup"
              aria-label="Logo mark"
              className="grid grid-cols-5 gap-1.5 rounded-xl bg-muted/40 p-2 ring-1 ring-inset ring-border/60 sm:grid-cols-8 xl:grid-cols-10"
            >
              {LOGO_ICONS.map((icon) => {
                const active = selectedIcon?.id === icon.id;
                return (
                  <button
                    key={icon.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={icon.name}
                    title={icon.name}
                    onClick={() => setLogoIcon(icon.lightSvg)}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-lg transition-colors hover:bg-background/70 focus-visible:outline-2 focus-visible:outline-ring',
                      active && 'bg-background shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.06)] dark:bg-zinc-800'
                    )}
                  >
                    <MarkTile svg={icon.lightSvg} rotation={logoColor} className="size-6" />
                  </button>
                );
              })}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={cn(pillClass, 'bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)]')}>
                  <Code className="size-3.5" aria-hidden="true" />
                  Custom SVG
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(500px,calc(100vw-2rem))] space-y-3" align="start">
                <Label htmlFor="custom-svg">SVG</Label>
                <Textarea
                  id="custom-svg"
                  value={logoIcon}
                  onChange={(e) => setLogoIcon(e.target.value)}
                  className="min-h-[260px] font-mono text-xs"
                  placeholder="<svg>...</svg>"
                />
                {logoIcon.trim() && !safeLogo && <p role="alert" className="text-xs text-destructive">Not a valid, safe SVG</p>}
              </PopoverContent>
            </Popover>
          </section>

          <section className="space-y-3">
            <SectionTitle meta={`${Math.round(rotation)}°`}>Colour</SectionTitle>
            <Track label="Logo colour">
              {HUES.map((preset) => (
                <Pill key={preset.value} active={Math.round(rotation) === preset.value} onClick={() => setLogoColor(String(preset.value))}>
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full"
                    style={{ background: `hsl(${(REGISTRY_BASE_HUE + preset.value) % 360} 64% 45%)` }}
                  />
                  {preset.name}
                </Pill>
              ))}
            </Track>
            <HueSlider value={rotation} onValueChange={(value) => setLogoColor(String(value))} className="max-w-md" />
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start" aria-label="Preview">
          <SectionTitle>Preview</SectionTitle>
          <div className="overflow-hidden rounded-xl ring-1 ring-border">
            <div className="flex min-h-16 items-center gap-2.5 bg-[#f3f0e8] px-4 text-[#1a1712]">
              <MarkTile svg={safeLogo} rotation={logoColor} className="size-6" />
              <span className="truncate font-serif text-xl leading-none">{name || 'Store'}</span>
            </div>
            <div className="space-y-2 border-t border-[#d8d1c2] bg-[#f3f0e8] px-4 py-5 text-[#1a1712]">
              <p className="font-serif text-2xl leading-7">{homepageTitle || name || 'Store'}</p>
              {homepageDescription && <p className="text-sm text-[#5a5348]">{homepageDescription}</p>}
              <span
                className="mt-2 inline-flex min-h-9 items-center rounded-full px-4 text-[13px] font-medium text-[#fbf8f1]"
                style={{ background: `hsl(${accentHue} 64% 34%)` }}
              >
                Accent
              </span>
            </div>
            <div className="flex min-h-14 items-center gap-2.5 bg-[#201c16] px-4 text-[#f3eee3]">
              <MarkTile svg={safeLogo} rotation={logoColor} className="size-5" />
              <span className="truncate font-serif text-lg leading-none">{name || 'Store'}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
