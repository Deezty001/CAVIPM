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
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "px-3 py-2 text-sm rounded-lg border transition-all duration-150",
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

Input.displayName = "Input";
