import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-orthodox-gold focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-orthodox-gold text-orthodox-dark shadow",
        secondary:
          "border-transparent bg-orthodox-burgundy text-white",
        destructive:
          "border-transparent bg-red-600 text-white shadow",
        outline: "border-orthodox-gold/30 text-orthodox-gold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
