import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <span className="text-sm font-medium text-muted-foreground">Minta</span>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-20 text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-primary sm:text-6xl">
          Minta
        </h1>
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Make money make sense
        </p>
        <p className="max-w-xs text-lg text-foreground sm:max-w-sm">
          Gastá con cabeza.{" "}
          <span className="text-gold font-semibold">Ahorrá más.</span> Hacé
          crecer tu patrimonio.
        </p>
      </main>
    </div>
  );
}
