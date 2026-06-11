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
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-medium text-[#6b6b6b]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "min-h-24 w-full resize-y rounded-[10px] border bg-[#f5f5f3] px-[14px] py-2.5 text-[13px] leading-relaxed text-[#111111] outline-none transition-all duration-150",
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

Textarea.displayName = "Textarea";
