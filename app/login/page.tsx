// app/login/page.tsx
"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

import { signInWithPasswordAction } from "@/app/auth/actions"; // Import the actual action

import { AlertTriangle, ChromeIcon, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  // No longer need separate isLoadingEmailPass, useTransition's isPending can cover it
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false)

  const handleEmailPasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await signInWithPasswordAction({ email, password });

      if (result.error) {
        setError(result.error)
      } else if (result.user && result.session) {
        router.push("/dashboard")
        router.refresh();
      } else {
        // Fallback error if action doesn't return expected structure
        setError("Ocorreu um erro inesperado durante o login.");
      }
    })
  }

  const handleGoogleLogin = async () => {
    setError(null)
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
          <CardTitle className="text-2xl font-bold tracking-tight">Acessar Painel</CardTitle>
          <CardDescription>Bem-vindo de volta! Faça login para continuar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro no Login</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
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
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending || isLoadingGoogle}
              />
            </div>
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={isPending || isLoadingGoogle}>
              {isPending && !isLoadingGoogle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar com Email
            </Button>
          </form>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoadingGoogle || isPending}>
            {isLoadingGoogle ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ChromeIcon className="mr-2 h-4 w-4" />
            )}
            Entrar com Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm space-y-2">
          <p>
            Não tem uma conta?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Crie uma aqui
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
