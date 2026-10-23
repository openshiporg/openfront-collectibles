import LocalizedClientLink from "../../../common/components/localized-client-link"
import StatusDot from "../../../common/components/collectibles/status-dot"

type ProductDescription = {
  document?: any;
} | string | null;

type ProductCollectionInfo = {
  handle?: string | null;
  title?: string | null;
};

type ProductInfoType = {
  title?: string | null;
  description?: ProductDescription;
  productCollections?: ProductCollectionInfo[] | null;
  productVariants?: { inventoryQuantity?: number | null; isUniqueCollectible?: boolean | null }[] | null;
};

type ProductInfoProps = {
  product: ProductInfoType;
};
export const renderers = {
  inline: {
    link: ({ children, href }: { children: React.ReactNode, href: string }) => {
      if (href.startsWith("/")) {
        return (
          <LocalizedClientLink
            href={href}
            className="text-cx-accent underline underline-offset-2 hover:text-cx-ink"
          >
            {children}
          </LocalizedClientLink>
        )
      }

      return (
        <a
          href={href}
          className="text-cx-accent underline underline-offset-2 hover:text-cx-ink"
        >
          {children}
        </a>
      )
    },
    bold: ({ children }: { children: React.ReactNode }) => {
      return <span className="font-semibold">{children}</span>
    }
  },
  block: {
    heading: ({ children, level }: { children: React.ReactNode, level: number }) => {
      const sizes: Record<number, string> = {
        1: "text-3xl",
        2: "text-2xl",
        3: "text-xl",
        4: "text-lg",
        5: "text-base",
        6: "text-sm"
      }

      const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return (
        <HeadingTag
          className={`${sizes[level]} mb-2 font-cx-serif leading-tight text-cx-ink`}
        >
          {children}
        </HeadingTag>
      )
    },
    paragraph: ({ children, textAlign }: { children: React.ReactNode, textAlign?: string }) => {
      return (
        <p // Replaced Text with p
          className={`mb-4 text-[15px] leading-[24px] text-cx-ink-2 ${
            textAlign ? `text-${textAlign}` : ''
          }`}
        >
          {children}
        </p>
      )
    },
    blockquote: ({ children }: { children: React.ReactNode }) => {
      return (
        <blockquote className="my-4 border-l-2 border-cx-accent pl-4 font-cx-serif italic">
          <p className="text-cx-ink-2">{children}</p>
        </blockquote>
      )
    },
    list: ({ children, type }: { children: React.ReactNode[], type: "ordered" | "unordered" }) => {
      const List = type === "ordered" ? "ol" : "ul"

      return (
        <List className={`${type === "ordered" ? "list-decimal" : "list-disc"} mb-4 pl-5 text-[15px] leading-[24px] text-cx-ink-2`}>
          {children.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </List>
      )
    },
  }
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const variants = product.productVariants || []
  const available = variants.some((v) => (v.inventoryQuantity ?? 0) > 0)
  const unique = variants.length === 1 && variants[0]?.isUniqueCollectible
  const collection = product.productCollections?.[0]

  return (
    <div id="product-info" className="space-y-3">
      {collection && (
        <LocalizedClientLink
          href={`/collections/${collection.handle}`}
          className="cx-label inline-flex min-h-8 items-center hover:text-cx-ink"
        >
          {collection.title}
        </LocalizedClientLink>
      )}
      <h1
        className="font-cx-serif text-[32px] leading-[36px] tracking-[-0.015em] text-cx-ink sm:text-[40px] sm:leading-[44px]"
        data-testid="product-title"
      >
        {product.title}
      </h1>
      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px] text-cx-ink-2">
        <span className="inline-flex items-baseline gap-1.5">
          <StatusDot tone={available ? "ok" : "muted"} />
          {available ? "Available" : "Unavailable"}
        </span>
        {unique && <span>One of one</span>}
      </p>
    </div>
  )
}

export default ProductInfo
