import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium " +
    "transition-colors disabled:pointer-events-none disabled:opacity-50 " +
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
    "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-4 py-2", // 44px min target (UI-§5.1)
        sm: "h-9 px-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
