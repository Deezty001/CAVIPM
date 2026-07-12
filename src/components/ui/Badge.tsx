import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] border px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[.08em] leading-[1.4]",
        variant === "outline" && "bg-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}
