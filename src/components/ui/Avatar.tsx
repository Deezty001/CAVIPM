import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
];

function colorForInitials(initials: string): string {
  let n = 0;
  for (const c of initials) n += c.charCodeAt(0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

interface AvatarProps {
  initials: string;
  size?: "xs" | "sm" | "md";
  className?: string;
  title?: string;
}

export function Avatar({ initials, size = "sm", className, title }: AvatarProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center justify-center rounded-[4px] font-semibold shrink-0",
        colorForInitials(initials),
        size === "xs" && "w-5 h-5 text-[10px]",
        size === "sm" && "w-6 h-6 text-xs",
        size === "md" && "w-8 h-8 text-sm",
        className
      )}
    >
      {initials}
    </span>
  );
}
