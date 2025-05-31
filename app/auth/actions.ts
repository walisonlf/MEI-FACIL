// app/auth/actions.ts
"use server"

import { createServerComponentClient } from "@/lib/supabase/server" // Changed import
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod" // Ensure z is imported if not already
import { EmailPasswordSchema } from "@/lib/schemas"

// Sign Up Action
export async function signUpAction(credentials: z.infer<typeof EmailPasswordSchema>) {
  const supabase = createServerComponentClient()
  const origin = headers().get("origin") // Needed for email confirmation link

  // Validate credentials with Zod (optional here if validated client-side first, but good for server-side)
  const result = EmailPasswordSchema.safeParse(credentials);
  if (!result.success) {
    return { error: "Dados inválidos.", user: null };
  }
  const { email, password } = result.data;


  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`, // Supabase sends confirmation link here
    },
  })

  if (error) {
    console.error("Supabase signUp error:", error.message)
    // More specific error messages can be returned based on error.code or error.message
    if (error.message.includes("User already registered")) {
         return { error: "Este email já está cadastrado.", user: null }
    }
    return { error: `Erro ao criar conta: ${error.message}`, user: null }
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    // This case might indicate an issue like email already in use but unconfirmed,
    // or some other edge case where a user object is returned but no identity.
    // Supabase typically returns an error for "User already registered".
    // For "Email rate limit exceeded", Supabase returns a specific error.
    // If identities are empty, it might mean the user needs to confirm their email but signUp didn't error.
    return { error: "Este email pode já estar em uso ou requer confirmação.", user: null}
  }

  // For email confirmation flows, data.user might exist but session might be null until confirmed.
  // The success message should guide the user to check their email.
  return { error: null, user: data.user, message: "Cadastro quase completo! Verifique seu email para confirmar sua conta." }
}

// Sign In with Email/Password Action
export async function signInWithPasswordAction(credentials: z.infer<typeof EmailPasswordSchema>) {
  const supabase = createServerComponentClient()

  // Validate credentials with Zod
  const result = EmailPasswordSchema.safeParse(credentials);
  if (!result.success) {
    return { error: "Dados inválidos.", user: null, session: null };
  }
  const { email, password } = result.data;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Supabase signInWithPassword error:", error.message)
    if (error.message === "Invalid login credentials") {
      return { error: "Email ou senha inválidos.", user: null, session: null }
    }
    return { error: `Erro ao fazer login: ${error.message}`, user: null, session: null }
  }

  // On successful login, Supabase client handles setting the session cookie.
  // No explicit redirect here; client-side will handle redirection based on response.
  return { error: null, user: data.user, session: data.session }
}

// Sign Out Action
export async function signOutAction() {
  const supabase = createServerComponentClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Supabase signOut error:", error.message)
    // Even if signout fails on server, client should probably still clear its state and redirect.
    // Depending on the error, you might want to handle it differently.
    // For now, we'll redirect regardless on the client-side invoking this.
    return { error: `Erro ao sair: ${error.message}` }
  }

  // Redirect to login page after sign out.
  // This redirect can also be handled client-side after calling the action.
  // To ensure server-side session is cleared before client navigates,
  // a redirect here is fine, or the client can redirect after a success response.
  // Let's make it redirect from server for this example.
  // However, for SPA-like behavior, client-side redirect after success is common.
  // For this action, we'll return success/error and let client redirect.
  return { error: null }
}

// This is the auth callback route handler that Supabase redirects to
// after a user confirms their email (from signup) or clicks a magic link / oauth.
// It exchanges the code for a session and redirects the user.
export async function exchangeCodeForSession(request: Request) {
    const supabase = createServerComponentClient();
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
            console.error("Supabase exchangeCodeForSession error:", error.message);
            // Redirect to an error page or login page with an error message
            return redirect("/login?error=Falha ao verificar email: " + encodeURIComponent(error.message));
        }
    } else {
        console.error("No code found in auth callback request.");
        return redirect("/login?error=Código de verificação não encontrado.");
    }
    // Redirect to dashboard or a "welcome" page after successful email confirmation / OAuth
    return redirect("/dashboard");
}

const EmailSchema = z.string().email({ message: "Email inválido." });

export async function requestPasswordResetAction(email: string) {
  const supabase = createServerComponentClient();
  const origin = headers().get("origin");

  const validationResult = EmailSchema.safeParse(email);
  if (!validationResult.success) {
    return { error: "Formato de email inválido.", message: null };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/update-password`, // Or your chosen update password page
  });

  if (error) {
    console.error("Supabase requestPasswordReset error:", error.message);
    // Supabase usually doesn't confirm if the email exists for security reasons.
    // So, even on error (like user not found), we might return a generic success message.
    // However, for some errors (e.g., rate limits), you might want to show them.
    // For "For security purposes, you can only request this once every X seconds"
    if (error.message.includes("For security purposes")) {
        return { error: "Muitas tentativas. Tente novamente mais tarde.", message: null };
    }
    // Default to a generic message that doesn't reveal if the email is in the system
    return { error: null, message: "Se uma conta com este email existir, um link de recuperação foi enviado." };
  }

  return { error: null, message: "Se uma conta com este email existir, um link de recuperação foi enviado." };
}
