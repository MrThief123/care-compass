import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-[28px] w-[28px] text-body-secondary",
  md: "h-[32px] w-[32px] text-body-small",
  lg: "h-[46px] w-[46px] text-body-emphasis",
} as const;

export interface AvatarProps {
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-bg-brand-pale font-medium text-text-brand",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initialsFor(name)}
    </span>
  );
}
