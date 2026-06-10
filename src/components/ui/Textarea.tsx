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
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "px-3 py-2 text-sm rounded-lg border transition-all duration-150 resize-none",
            "placeholder:text-gray-400",
            "focus:outline-none focus:ring-2",
            error && "border-red-400",
            className
          )}
          style={
            {
              borderColor: error ? undefined : "var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              "--tw-ring-color": "var(--accent-mid)",
            } as React.CSSProperties
          }
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
