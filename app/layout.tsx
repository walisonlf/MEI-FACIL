import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css" // Ensure your globals.css is imported
import { ThemeProvider } from "@/components/theme-provider" // Assuming you have this for dark mode

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MEI Fácil - Gestão Simplificada para seu MEI",
  description: "Controle suas finanças, acompanhe o limite anual e nunca mais esqueça do DAS. Tudo em um só lugar.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
