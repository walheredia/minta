import { Leaf } from "lucide-react"
import { cn } from "cn"

interface WordmarkProps {
  className?: string
}

// Minta's logomark + name. Purely presentational; used in the auth brand
// panel, the mobile auth header and the app shell.
export function Wordmark({ className }: WordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
      >
        <Leaf className="size-4" strokeWidth={2.25} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-foreground">Minta</span>
    </span>
  )
}
