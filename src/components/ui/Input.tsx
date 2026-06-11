import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[#6b6b6b]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-[38px] w-full rounded-[10px] border bg-[#f5f5f3] px-[14px] text-[13px] text-[#111111] outline-none transition-all duration-150",
            "placeholder:text-[#a0a0a0] hover:border-[#bebebe] focus:border-[#111111] focus:bg-white focus:shadow-[0_0_0_3px_rgba(17,17,17,0.08)]",
            error ? "border-[#a03535]" : "border-[#e0e0de]",
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] font-medium text-[#a03535]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
