// app/signup/page.tsx
"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
// useRouter might not be needed if not redirecting immediately after signup
// import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

import { signUpAction } from "@/app/auth/actions"; // Import the actual action

import { AlertTriangle, ChromeIcon, Loader2 } from "lucide-react"

export default function SignupPage() {
  // const router = useRouter() // Not redirecting from here immediately
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false)

  const handleEmailPasswordSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return;
    }

    startTransition(async () => {
      const result = await signUpAction({ email, password });

      if (result.error) {
        setError(result.error)
      } else if (result.user) {
        // Successfully initiated signup, Supabase will send a confirmation email.
        setSuccessMessage(result.message || "Cadastro iniciado! Verifique seu email para confirmação.");
        // Clear form potentially
        // setEmail("");
        // setPassword("");
        // setConfirmPassword("");
      } else {
         setError("Ocorreu um erro inesperado durante o cadastro.");
      }
    });
  }

  const handleGoogleSignup = async () => {
    setError(null)
    setSuccessMessage(null)
    setIsLoadingGoogle(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setIsLoadingGoogle(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Criar Nova Conta</CardTitle>
          <CardDescription>Junte-se a nós! É rápido e fácil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro no Cadastro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
             <Alert variant="default" className="bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300">
              <AlertTitle>Sucesso!</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleEmailPasswordSignup} className="space-y-4">
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
                disabled={isPending || isLoadingGoogle}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Crie uma senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending || isLoadingGoogle}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isPending || isLoadingGoogle}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending || isLoadingGoogle}>
              {isPending && !isLoadingGoogle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Conta com Email
            </Button>
          </form>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou cadastre-se com
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={isLoadingGoogle || isPending}>
            {isLoadingGoogle ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ChromeIcon className="mr-2 h-4 w-4" />
            )}
            Cadastrar com Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm space-y-2">
          <p>
            Já tem uma conta?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Faça login aqui
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
