"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type ImageGalleryProps = {
  images: any[];
  handle: string;
  region: any;
  /** Shown in serif on the no-photo art. */
  title?: string;
  /** Small caps label on the no-photo art. */
  label?: string | null;
};

const srcOf = (image: any) => image?.image?.url || image?.imagePath || image?.url || null

const ImageGallery = ({ images, title, label }: ImageGalleryProps) => {
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [active, setActive] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)

  // Listen for variant changes from ProductActions
  useEffect(() => {
    const handleVariantChange = (event: any) => {
      setSelectedVariant(event.detail)
    }

    window.addEventListener('variantChange', handleVariantChange)
    return () => window.removeEventListener('variantChange', handleVariantChange)
  }, [])

  const sortedImages = [...images].sort((a, b) => (a.order || 0) - (b.order || 0))

  // A selected variant's primary image leads the gallery.
  const displayImages = (
    selectedVariant?.primaryImage
      ? [selectedVariant.primaryImage, ...sortedImages.filter(img => img.id !== selectedVariant.primaryImage.id)]
      : sortedImages
  ).filter((image) => srcOf(image))

  useEffect(() => {
    setActive(0)
    scroller.current?.scrollTo({ left: 0 })
  }, [selectedVariant?.id])

  const goTo = (index: number) => {
    setActive(index)
    const el = scroller.current
    if (el) el.scrollTo({ left: el.clientWidth * index, behavior: "smooth" })
  }

  if (displayImages.length === 0) {
    return (
      <div className="relative flex aspect-[4/5] w-full flex-col justify-end gap-2 overflow-hidden rounded-[2px] bg-cx-tint p-6 sm:p-10">
        {label && <span className="cx-label">{label}</span>}
        {title && (
          <span className="max-w-[18ch] font-cx-display text-[36px] leading-[38px] text-cx-ink sm:text-[52px] sm:leading-[52px]">
            {title}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:items-start">
      <div
        ref={scroller}
        className="cx-pocket no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto rounded-[2px] bg-cx-well"
        onScroll={(event) => {
          const el = event.currentTarget
          const index = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1))
          if (index !== active) setActive(index)
        }}
        aria-label="Item photos"
      >
        {displayImages.map((image, index) => (
          <div key={image.id ?? index} className="relative aspect-[4/5] w-full shrink-0 snap-center" id={image.id}>
            <Image
              src={srcOf(image)}
              priority={index === 0}
              className="object-contain p-[7%]"
              alt={image?.altText || (title ? `${title}, photo ${index + 1}` : `Photo ${index + 1}`)}
              fill
              sizes="(max-width: 1024px) 100vw, 700px"
            />
          </div>
        ))}
      </div>
      {displayImages.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto lg:w-[72px] lg:shrink-0 lg:flex-col">
          {displayImages.map((image, index) => (
            <button
              key={image.id ?? index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={active === index}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-[2px] bg-cx-well ring-1 transition lg:size-[72px]",
                active === index ? "ring-2 ring-cx-ink" : "ring-cx-line opacity-70 hover:opacity-100"
              )}
            >
              <Image src={srcOf(image)} alt="" fill sizes="72px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
