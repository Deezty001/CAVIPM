import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer border",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          size === "sm" && "text-xs px-3 py-1.5",
          size === "md" && "text-sm px-4 py-2",
          size === "lg" && "text-sm px-5 py-2.5",
          variant === "primary" && "text-white border-transparent hover:opacity-90 active:scale-[0.98]",
          variant === "secondary" && "border bg-white hover:bg-gray-50 active:scale-[0.98]",
          variant === "ghost" && "border-transparent bg-transparent hover:bg-black/5",
          variant === "danger" && "text-red-600 border-red-200 bg-red-50 hover:bg-red-100",
          className
        )}
        style={
          variant === "primary"
            ? { background: "var(--accent)", borderColor: "var(--accent)" }
            : variant === "secondary"
            ? { borderColor: "var(--border)", color: "var(--text-primary)" }
            : { color: "var(--text-secondary)" }
        }
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
