import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/login-form"

export default function IngresarPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Ingresá a tu cuenta</CardTitle>
          <CardDescription>
            Iniciá sesión con tu email y tu contraseña para ver tus gastos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        ¿Todavía no tenés una cuenta?{" "}
        <Link href="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
          Registrate
        </Link>
      </p>
    </main>
  )
}
