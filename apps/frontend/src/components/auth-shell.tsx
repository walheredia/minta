import type { ReactNode } from "react"
import { ArrowLeftRight, CalendarRange, ShieldCheck } from "lucide-react"
import { Wordmark } from "@/components/brand/wordmark"
import { ThemeToggle } from "@/components/theme-toggle"
import { formatAmount } from "@/lib/expenses"

interface AuthShellProps {
  title: string
  description: string
  /** The form (or success state) for this screen. */
  children: ReactNode
  /** Secondary link shown under the form, e.g. "¿Todavía no tenés una cuenta?". */
  footer: ReactNode
}

const VALUE_PROPS = [
  {
    icon: ArrowLeftRight,
    text: "Cada gasto en la moneda en que lo pagaste: pesos o dólares, sin conversiones.",
  },
  {
    icon: CalendarRange,
    text: "El total del mes de un vistazo, separado por moneda.",
  },
  {
    icon: ShieldCheck,
    text: "Tus gastos personales son solo tuyos.",
  },
]

// Static sample figures for the brand panel preview. ARS and USD are shown as
// separate totals, never combined (ADR 0002), mirroring the real /gastos screen.
const SAMPLE_TOTALS = [
  { label: "Pesos", value: formatAmount(482350, "ARS") },
  { label: "Dólares", value: formatAmount(120, "USD") },
]

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r bg-accent/60 dark:bg-card lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div aria-hidden className="bg-brand-glow pointer-events-none absolute inset-0" />

      <Wordmark className="relative" />

      <div className="relative flex max-w-md flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground">
            Gastá con cabeza. <span className="text-primary">Ahorrá más.</span>
          </h2>
          <p className="text-base text-muted-foreground">
            Minta te muestra en qué se va tu plata, mes a mes, pensado para la economía argentina.
          </p>
        </div>

        <div className="rounded-xl bg-background/70 p-5 ring-1 ring-border backdrop-blur-sm">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Total del mes
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            {SAMPLE_TOTALS.map((total) => (
              <div key={total.label} className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">{total.label}</span>
                <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
                  {total.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <ul className="flex flex-col gap-4">
          {VALUE_PROPS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-muted-foreground">
              <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-muted-foreground">Make money make sense.</p>
    </aside>
  )
}

// Layout for the unauthenticated screens (ingresar, registro): brand panel +
// form split on desktop, form-only with the wordmark on mobile. See the
// "Auth screens" pattern in DESIGN.md.
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <BrandPanel />

      <div className="relative flex flex-col px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between lg:justify-end">
          <Wordmark className="lg:hidden" />
          <ThemeToggle />
        </div>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="flex w-full max-w-sm flex-col gap-8 duration-300 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            {children}

            <p className="text-center text-sm text-muted-foreground">{footer}</p>
          </div>
        </main>
      </div>
    </div>
  )
}
