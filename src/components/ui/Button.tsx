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
          "inline-flex items-center justify-center gap-1.5 rounded-xl border font-semibold leading-none transition-all duration-200 cursor-pointer",
          "focus-visible:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" && "h-8 px-3.5 text-xs",
          size === "md" && "h-10 px-5 text-[13px]",
          size === "lg" && "h-12 px-7 text-sm",
          variant === "primary" && "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]",
          variant === "secondary" && "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 active:scale-[0.98]",
          variant === "ghost" && "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]",
          variant === "danger" && "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 active:scale-[0.98]",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
