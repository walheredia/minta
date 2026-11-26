import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RegisterForm } from "@/components/register-form"

export default function RegistroPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Creá tu cuenta</CardTitle>
          <CardDescription>
            Registrate con tu email y una contraseña para empezar a usar
            Minta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        ¿Ya tenés una cuenta?{" "}
        <Link href="/ingresar" className="font-medium text-primary underline-offset-4 hover:underline">
          Ingresá
        </Link>
      </p>
    </main>
  )
}
