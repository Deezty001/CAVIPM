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
          "inline-flex items-center justify-center gap-1.5 rounded-[5px] border font-semibold leading-none transition-all duration-200 ease-out cursor-pointer",
          "focus-visible:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" && "h-8 px-3.5 text-xs",
          size === "md" && "h-10 px-4 text-[12px]",
          size === "lg" && "h-12 px-6 text-sm",
          variant === "primary" && "border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700 hover:shadow-md active:translate-y-px",
          variant === "secondary" && "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 active:translate-y-px",
          variant === "ghost" && "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          variant === "danger" && "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
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
