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
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-xl border bg-slate-50 px-3.5 text-[13px] text-slate-900 outline-none transition-all duration-200",
            "placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]",
            error ? "border-red-400" : "border-slate-200",
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
