import { cn } from "@/lib/utils"
import Image from "next/image"
import React from "react"

import PlaceholderImage from "@/features/storefront/modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null;
  images?: any[] | null;
  size?: "small" | "medium" | "large" | "full" | "square";
  isFeatured?: boolean;
  className?: string;
  /** Shown in serif when there is no photo. */
  title?: string | null;
  /** Small caps label above the title when there is no photo (category or collection). */
  label?: string | null;
  "data-testid"?: string;
};

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  title,
  label,
  "data-testid": dataTestid,
}) => {
  const initialImage =
    thumbnail ||
    images?.[0]?.url ||
    images?.[0]?.image?.url ||
    images?.[0]?.imagePath ||
    null;

  return (
    <div
      className={cn(
        "cx-pocket relative w-full overflow-hidden rounded-[2px] bg-cx-well",
        className,
        {
          "aspect-[4/5]": isFeatured || (size !== "square" && size !== "small"),
          "aspect-square": size === "square" || size === "small",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      {initialImage ? (
        <Image
          src={initialImage}
          alt={title || "Item photo"}
          className="absolute inset-0 object-contain object-center p-[9%] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1"
          draggable={false}
          sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
          fill
          suppressHydrationWarning
        />
      ) : title ? (
        <div className="absolute inset-[9%] flex flex-col justify-end gap-1.5 bg-cx-tint p-4">
          {label && <span className="cx-label">{label}</span>}
          <span className="line-clamp-4 font-cx-display text-[20px] leading-[22px] text-cx-ink sm:text-[24px] sm:leading-[26px]">
            {title}
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-cx-ink-3">
          <PlaceholderImage size={size === "small" ? 16 : 24} />
        </div>
      )}
    </div>
  )
}

export default Thumbnail
