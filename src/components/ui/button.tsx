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
        secondary:
          "border border-border-brand bg-transparent text-secondary-foreground hover:bg-secondary/40",
        ghost: "bg-transparent text-secondary-foreground underline-offset-4 hover:underline",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        md: "h-11 px-4 py-2", // 44px min target (UI-§5.1)
        lg: "h-12 px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
