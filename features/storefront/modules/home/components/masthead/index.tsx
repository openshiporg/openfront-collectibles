/** Home masthead: the merchant's own title and description, set large. */
export default function Masthead({ title, description }: { title?: string | null; description?: string | null }) {
  if (!title && !description) return null

  return (
    <section className="border-b border-cx-line pb-10 pt-12 sm:pb-14 sm:pt-20">
      {title && (
        <h1 className="max-w-[16ch] font-cx-serif text-[44px] leading-[46px] tracking-[-0.015em] text-cx-ink sm:text-[64px] sm:leading-[64px] lg:text-[80px] lg:leading-[78px]">
          {title}
        </h1>
      )}
      {description && (
        <p className="mt-5 max-w-[56ch] text-[16px] leading-[26px] text-cx-ink-2 sm:text-[18px] sm:leading-[28px]">
          {description}
        </p>
      )}
    </section>
  )
}
