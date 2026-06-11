"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: "rgba(17,17,17,0.35)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={cn(
          "relative w-full rounded-2xl animate-fade-up",
          "flex flex-col max-h-[90vh]",
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-2xl",
          size === "xl" && "max-w-4xl"
        )}
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-modal)" }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title && (
          <div
            className="flex shrink-0 items-center justify-between px-7 pb-4 pt-7"
          >
            <h2
              className="text-[17px] font-bold leading-[1.3] tracking-[-0.2px]"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5f5f3] text-[#6b6b6b] transition-colors hover:bg-[#e8e8e6] hover:text-[#111111]"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-7 pb-7">{children}</div>
      </div>
    </div>
  );
}
