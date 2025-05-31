"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Briefcase, Zap, Info } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Configurações Gerais
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Gerencie as configurações da sua conta e empresa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Perfil da Empresa</CardTitle>
                <CardDescription>Atualize os dados cadastrais do seu MEI.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Mantenha as informações da sua empresa sempre atualizadas para garantir a correta emissão de documentos e
              comunicações.
            </p>
            <Link href="/dashboard/settings/company-profile">
              <Button>Acessar Perfil da Empresa</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-dashed border-sky-500 bg-sky-50/50 dark:bg-sky-900/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-sky-500" />
              <div>
                <CardTitle className="text-sky-700 dark:text-sky-300">Automações Fiscais (Em Breve)</CardTitle>
                <CardDescription className="text-sky-600 dark:text-sky-400">
                  Simplifique sua rotina fiscal com nossas futuras integrações.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-sky-700 dark:text-sky-300">
              Estamos trabalhando para trazer automações que facilitarão a emissão do seu DAS mensal e a entrega da
              DASN-SIMEI (Declaração Anual).
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center">
                <Info className="h-3 w-3 mr-1.5 shrink-0" />
                Possíveis integrações incluirão APIs do Gov.BR (e-CAC) ou plataformas parceiras como BHub e Focus NFe.
              </p>
              <p className="flex items-center">
                <Info className="h-3 w-3 mr-1.5 shrink-0" />
                Este é um recurso avançado que exigirá configurações adicionais e, possivelmente, um plano Pro ativo.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-sky-500 text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-800"
              disabled
            >
              Saiba Mais (Em Breve)
            </Button>
          </CardContent>
        </Card>
      </div>
      {/* Adicionar mais seções de configuração aqui, como "Preferências de Notificação", "Segurança", etc. */}
    </div>
  )
}
