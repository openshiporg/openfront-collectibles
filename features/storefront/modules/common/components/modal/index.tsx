import { cn } from "@/lib/utils"
import React, { Fragment, createContext, useContext } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import X from "@/features/storefront/modules/common/icons/x"

type ModalContextType = {
  close: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider = ({ children, close }: { children: React.ReactNode; close: () => void }) => {
  return (
    <ModalContext.Provider value={{ close }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

type ModalProps = {
  isOpen: boolean
  close: () => void
  size?: "small" | "medium" | "large"
  search?: boolean
  children: React.ReactNode
  'data-testid'?: string
}

const Modal = ({
  isOpen,
  close,
  size = "medium",
  search = false,
  children,
  'data-testid': dataTestId
}: ModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        data-testid={dataTestId}
        className={cn( 
          "flex flex-col justify-start w-full transform p-5 text-left align-middle transition-all max-h-[75vh] h-fit",
          {
            "max-w-md": size === "small",
            "max-w-xl": size === "medium",
            "max-w-3xl": size === "large",
            "bg-transparent shadow-none border-none": search,
            "rounded-[2px] border border-cx-line bg-cx-surface text-cx-ink shadow-[0_24px_48px_-24px_rgb(0_0_0/0.45)]": !search,
          }
        )}
      >
        <ModalProvider close={close}>{children}</ModalProvider>
      </DialogContent>
    </Dialog>
  )
}

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { close } = useModal()

  return (
    <DialogHeader className="flex flex-row items-center justify-between pb-4">
      <DialogTitle className="font-cx-serif text-[22px] font-normal leading-[26px]">{children}</DialogTitle>
      <button onClick={close} data-testid="close-modal-button" aria-label="Close" className="-mr-2 ml-auto inline-flex size-11 items-center justify-center rounded-[2px] text-cx-ink-2 hover:bg-cx-well hover:text-cx-ink">
        <X size={20} />
      </button>
    </DialogHeader>
  )
}

const Description: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DialogDescription className="flex h-full items-center justify-start pb-4 pt-1 text-[13px] text-cx-ink-2">
      {children}
    </DialogDescription>
  )
}

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex">{children}</div>
}

const Footer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex items-center justify-end gap-x-4">{children}</div>
}

Modal.Title = Title
Modal.Description = Description
Modal.Body = Body
Modal.Footer = Footer

export default Modal
