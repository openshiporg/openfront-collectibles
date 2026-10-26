// Rarity marks drawn as the card prints them: circle, diamond, stars; gold for illustration
// and hyper rares, outlined silver for ultra rares. Every mark carries its rarity as a label.

type MarkSpec = { shape: 'circle' | 'diamond' | 'star' | 'text'; count?: number; tone?: 'ink' | 'silver' | 'gold'; text?: string; sparkle?: boolean };

export function rarityMarkSpec(rarity: string | null | undefined): MarkSpec {
  const r = String(rarity || '').toLowerCase();
  if (!r) return { shape: 'text', text: '' };
  if (r === 'common') return { shape: 'circle' };
  if (r === 'uncommon') return { shape: 'diamond' };
  if (r.includes('ace spec')) return { shape: 'text', text: 'ACE' };
  if (r.includes('promo')) return { shape: 'text', text: 'PR' };
  if (r.includes('rgb')) return { shape: 'text', text: 'RGB' };
  if (r.includes('radiant')) return { shape: 'star', count: 1, tone: 'silver', sparkle: true };
  if (r.includes('shiny ultra')) return { shape: 'star', count: 2, tone: 'gold', sparkle: true };
  if (r.includes('shiny')) return { shape: 'star', count: 1, tone: 'gold', sparkle: true };
  if (r.includes('special illustration')) return { shape: 'star', count: 2, tone: 'gold' };
  if (r.includes('illustration')) return { shape: 'star', count: 1, tone: 'gold' };
  if (r.includes('hyper') || r.includes('secret') || r.includes('rainbow') || r.includes('futuristic')) return { shape: 'star', count: 3, tone: 'gold' };
  if (r.includes('ultra')) return { shape: 'star', count: 2, tone: 'silver' };
  if (r.includes('double')) return { shape: 'star', count: 2, tone: 'ink' };
  if (r.includes('holo') || r === 'rare' || r.startsWith('rare')) return { shape: 'star', count: 1, tone: 'ink' };
  return { shape: 'text', text: r.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 3) };
}

const STAR = 'M6 0.6l1.55 3.4 3.7.4-2.77 2.5.8 3.65L6 8.7 2.72 10.55l.8-3.65L.75 4.4l3.7-.4z';

function Glyph({ shape, tone, sparkle }: { shape: MarkSpec['shape']; tone: MarkSpec['tone']; sparkle?: boolean }) {
  const fill = tone === 'gold' ? 'var(--tc-accent)' : tone === 'silver' ? 'none' : 'currentColor';
  const stroke = tone === 'silver' ? 'currentColor' : 'none';
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" focusable="false">
      {shape === 'circle' && <circle cx="6" cy="6" r="3.6" fill="currentColor" />}
      {shape === 'diamond' && <path d="M6 1.4L10.6 6 6 10.6 1.4 6z" fill="currentColor" />}
      {shape === 'star' && <path d={STAR} fill={fill} stroke={stroke} strokeWidth={stroke === 'none' ? 0 : 1} strokeLinejoin="round" />}
      {shape === 'star' && sparkle && <path d="M10.6 0.4v2.2M9.5 1.5h2.2" stroke="currentColor" strokeWidth="0.9" />}
    </svg>
  );
}

export function RarityMark({ rarity, className }: { rarity?: string | null; className?: string }) {
  const spec = rarityMarkSpec(rarity);
  if (!rarity) return null;
  return (
    <span className={`inline-flex items-center gap-px text-[var(--tc-ink-2)] ${className ?? ''}`} title={rarity} role="img" aria-label={rarity}>
      {spec.shape === 'text' ? (
        <span className="tc-stamp text-[10px] leading-none">{spec.text}</span>
      ) : (
        Array.from({ length: spec.count ?? 1 }, (_, i) => <Glyph key={i} shape={spec.shape} tone={spec.tone} sparkle={spec.sparkle && i === 0} />)
      )}
    </span>
  );
}
