import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium text-[#6b6b6b]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "h-[38px] w-full appearance-none rounded-[10px] border bg-[#f5f5f3] px-[14px] pr-9 text-[13px] text-[#111111] outline-none transition-all duration-150",
              "hover:border-[#bebebe] focus:border-[#111111] focus:bg-white focus:shadow-[0_0_0_3px_rgba(17,17,17,0.08)]",
              error ? "border-[#a03535]" : "border-[#e0e0de]",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--text-tertiary)" }}
          />
        </div>
        {error && <p className="text-[11px] font-medium text-[#a03535]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
