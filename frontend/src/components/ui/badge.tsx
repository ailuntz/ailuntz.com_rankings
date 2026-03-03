import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          "border-transparent bg-gray-900 dark:bg-gray-50 text-gray-50 dark:text-gray-900 hover:bg-gray-900/80 dark:hover:bg-gray-50/80":
            variant === "default",
          "border-transparent bg-[var(--color-badge-secondary-bg)] text-[var(--color-badge-secondary-text)] hover:opacity-80":
            variant === "secondary",
          "border-transparent bg-red-500 dark:bg-red-600 text-gray-50 hover:bg-red-500/80 dark:hover:bg-red-600/80":
            variant === "destructive",
          "text-[var(--color-text-primary)]": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
