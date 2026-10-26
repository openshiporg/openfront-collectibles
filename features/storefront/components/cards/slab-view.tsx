import { CardArt } from './card-art';
import { cn } from './format';
import type { CardFace, GradeFace } from './types';

/**
 * A graded slab: the clear case, the grader's label band (grader, card, grade, certificate),
 * and the card in its window. The label is generic; the grading company is named in text.
 */
export function SlabView({ card, grade, year, eager, compact, className }: { card: CardFace; grade: GradeFace; year?: number | null; eager?: boolean; compact?: boolean; className?: string }) {
  return (
    <figure className={cn('tc tc-slab', className)} aria-label={`${card.name} graded ${grade.company} ${grade.grade}`}>
      <div className="tc-slab-label">
        <span className="tc-stamp text-[11px] leading-none">{grade.company}</span>
        <span className="tc-slab-grade">
          <span className={cn('block font-extrabold tracking-[-0.03em]', compact ? 'text-[26px]' : 'text-[34px]')} style={{ fontStretch: '75%' }}>{grade.grade}</span>
          {grade.label ? <span className="tc-stamp block text-[10px]">{grade.label}</span> : null}
        </span>
        <span className={cn('truncate font-bold leading-tight', compact ? 'text-[12px]' : 'text-[13px]')}>{card.name}</span>
        <span className="tc-num truncate text-[11px] leading-tight opacity-75">
          {[year, card.setName, card.number].filter(Boolean).join(' · ')}
        </span>
      </div>
      <div className="tc-slab-window">
        <CardArt src={card.imageLargeUrl || card.imageUrl} alt={`${card.name} card art`} eager={eager} />
      </div>
      {grade.certificate && !compact ? (
        <figcaption className="tc-num flex flex-wrap justify-between gap-x-3 px-1 text-[12px] text-[var(--tc-ink-3)]">
          <span>Cert {grade.certificate}</span>
          {grade.sample ? <span>Sample record</span> : grade.certificateUrl ? <a className="underline underline-offset-2 hover:text-[var(--tc-ink)]" href={grade.certificateUrl} target="_blank" rel="noopener noreferrer">Verify with {grade.company}</a> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
