import Link from "next/link"
import { AuthShell } from "@/components/auth-shell"
import { LoginForm } from "@/components/login-form"

export default function IngresarPage() {
  return (
    <AuthShell
      title="Ingresá a Minta"
      footer={
        <>
          ¿Todavía no tenés una cuenta?{" "}
          <Link href="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
            Registrate
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
