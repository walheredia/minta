import * as React from "react"
import { cn } from "cn"

// Plain native <select>, styled to match `input.tsx`. A base-ui/shadcn
// listbox primitive isn't worth the portal/positioning complexity here for a
// two-option currency picker, and a native element keeps this trivially
// accessible and testable.
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { Select }
