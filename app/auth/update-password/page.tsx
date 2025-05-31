// app/auth/update-password/page.tsx
"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation" // useSearchParams to check for errors from redirect
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

// Icons
import { AlertTriangle, Loader2, CheckCircle } from "lucide-react"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Check for errors passed in URL from Supabase email link callback if any
  useEffect(() => {
    const errorParam = searchParams.get('error_description');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);


  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }
    if (password.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.")
      return
    }

    startTransition(async () => {
      // Supabase client handles the recovery token implicitly from the URL/session
      // when the user lands on this page from the email link.
      const { data, error: updateError } = await supabase.auth.updateUser({ password: password })

      if (updateError) {
        setError(`Falha ao atualizar senha: ${updateError.message}`)
      } else {
        setSuccessMessage("Senha atualizada com sucesso! Você será redirecionado para o login.")
        setPassword("")
        setConfirmPassword("")
        setTimeout(() => {
          router.push("/login")
        }, 3000) // Redirect after 3 seconds
      }
    })
  }

  // This page is typically accessed when the user's session already contains
  // an `access_token` that was part of the recovery email link.
  // If there's no valid recovery token in the session (e.g. user navigates here directly),
  // Supabase `updateUser` will likely fail. We can add a check for this if needed,
  // but Supabase often handles this by showing an error if the session isn't primed for recovery.

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Atualizar Senha</CardTitle>
          <CardDescription>
            Defina uma nova senha para sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert variant="default" className="bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Sucesso!</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          {!successMessage && ( // Only show form if no success message
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Atualizar Senha
              </Button>
            </Form>
          )}
           {successMessage && (
             <div className="text-center mt-4">
                <Link href="/login" className="font-medium text-primary hover:underline">
                    Ir para Login
                </Link>
             </div>
           )}
        </CardContent>
        {!successMessage && ( // Show footer with link to login only if form is visible
            <CardFooter className="flex justify-center text-sm">
                <p>Lembrou sua senha?{" "}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Faça login
                    </Link>
                </p>
            </CardFooter>
        )}
      </Card>
    </div>
  )
}
