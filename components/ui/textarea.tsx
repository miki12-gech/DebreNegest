import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-orthodox-gold/20 bg-orthodox-dark/50 px-3 py-2 text-sm text-orthodox-parchment shadow-sm placeholder:text-orthodox-parchment/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orthodox-gold disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
