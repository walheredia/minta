import Link from "next/link"
import { AuthShell } from "@/components/auth-shell"
import { RegisterForm } from "@/components/register-form"

export default function RegistroPage() {
  return (
    <AuthShell
      title="Creá tu cuenta"
      description="Solo necesitás un email y una contraseña de al menos 8 caracteres."
      footer={
        <>
          ¿Ya tenés una cuenta?{" "}
          <Link href="/ingresar" className="font-medium text-primary underline-offset-4 hover:underline">
            Ingresá
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
