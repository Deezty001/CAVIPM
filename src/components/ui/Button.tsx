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
          "inline-flex items-center justify-center gap-1.5 rounded-full border font-medium leading-none transition-all duration-150 cursor-pointer",
          "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" && "h-8 px-3 text-xs",
          size === "md" && "h-[38px] px-5 text-[13px]",
          size === "lg" && "h-11 px-7 text-sm",
          variant === "primary" && "border-[#111111] bg-[#111111] text-white hover:opacity-80 active:opacity-70",
          variant === "secondary" && "border-[#e0e0de] bg-white text-[#111111] hover:border-[#bebebe] hover:bg-[#f5f5f3] active:bg-[#edecea]",
          variant === "ghost" && "border-transparent bg-transparent text-[#6b6b6b] hover:bg-[#f0f0ee] hover:text-[#111111]",
          variant === "danger" && "border-transparent bg-[#f7ebeb] text-[#a03535] hover:bg-[#f1dddd]",
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
