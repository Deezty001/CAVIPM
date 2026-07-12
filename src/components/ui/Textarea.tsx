import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[10px] font-semibold text-slate-600 uppercase tracking-[.1em]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "min-h-24 w-full resize-y rounded-[5px] border bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-900 outline-none transition-all duration-200",
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

Textarea.displayName = "Textarea";
