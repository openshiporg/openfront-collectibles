import { deleteLineItem } from "@/features/storefront/lib/data/cart";
import { Trash2 } from "lucide-react"; 
import { useState } from "react";
import { cn } from "@/lib/utils";
import { RiLoader2Fill } from "@remixicon/react";

const DeleteButton = ({
  id,
  children,
  className,
}: {
  id: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    await deleteLineItem(id).catch((err) => {
      setIsDeleting(false);
    });
  };

  return (
    <button
      type="button"
      onClick={() => handleDelete(id)}
      disabled={isDeleting}
      aria-label={children ? undefined : "Remove"}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] text-cx-ink-2 transition-colors hover:bg-cx-well hover:text-cx-danger disabled:opacity-50",
        className
      )}
    >
      {isDeleting ? <RiLoader2Fill className="size-4 animate-spin" /> : <Trash2 className="size-4" aria-hidden="true" />}
      {children && <span>{children}</span>}
    </button>
  );
};

export default DeleteButton;
