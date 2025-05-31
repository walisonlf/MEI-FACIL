import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Briefcase, Settings2, ChevronLeft } from "lucide-react"

const navigationItems = [
  { name: "Configurações Gerais", href: "/dashboard/settings", icon: Settings2 },
  { name: "Perfil da Empresa", href: "/dashboard/settings/company-profile", icon: Briefcase },
  // { name: "Usuário & Segurança", href: "/dashboard/settings/user-security", icon: UserCircle },
  // Add more settings links here as needed
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800/50 shadow-sm sticky top-0 z-30 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4">
              <Button variant="outline" size="icon" aria-label="Voltar ao Painel">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Configurações</h1>
          </div>
          {/* Optional: Add user avatar or other header elements here */}
        </div>
      </header>

      <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 lg:w-72">
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                // Add active link styling if needed using usePathname
              >
                <item.icon className="mr-3 h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-primary" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 bg-white dark:bg-slate-800/50 shadow-lg rounded-lg p-6 md:p-8">{children}</main>
      </div>
      <footer className="text-center py-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          &copy; {new Date().getFullYear()} MEI Fácil. Configurações.
        </p>
      </footer>
    </div>
  )
}
