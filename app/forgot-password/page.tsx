// app/forgot-password/page.tsx
"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { requestPasswordResetAction } from "@/app/auth/actions"; // Import the actual action

// Icons
import { AlertTriangle, Loader2, MailCheck } from "lucide-react"


export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handlePasswordResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email) {
      setError("Por favor, insira seu endereço de email.")
      return
    }

    startTransition(async () => {
      const result = await requestPasswordResetAction(email);

      if (result.error) {
        setError(result.error)
        setSuccessMessage(null) // Ensure success message is cleared if there's an error
      } else if (result.message) { // Action returns message on both "success" and "user not found" for security
        setSuccessMessage(result.message)
        setError(null) // Clear previous errors
        setEmail("")
      } else {
        // Fallback if action doesn't return error or message (should not happen with current action logic)
        setError("Ocorreu um erro inesperado.")
      }
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu email abaixo. Se existir uma conta associada, enviaremos um link para redefinir sua senha.
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
              <MailCheck className="h-4 w-4" />
              <AlertTitle>Verifique seu Email</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          {!successMessage && (
            <form onSubmit={handlePasswordResetRequest} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Link de Recuperação
              </Button>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Voltar para o Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
