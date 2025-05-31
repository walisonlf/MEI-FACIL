"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCompanyProfile, updateCompanyProfile } from "@/app/actions"
import type { CompanyProfile } from "@/lib/types"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"

// Helper to format date for input type="date"
const formatDateForInput = (dateString?: string | null): string => {
  if (!dateString) return ""
  try {
    return new Date(dateString).toISOString().split("T")[0]
  } catch (e) {
    return "" // Return empty if date is invalid
  }
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<Partial<CompanyProfile>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true)
      setError(null)
      const fetchedProfile = await getCompanyProfile()
      if (fetchedProfile) {
        setProfile({
          ...fetchedProfile,
          data_abertura: formatDateForInput(fetchedProfile.data_abertura),
          titular_data_nascimento: formatDateForInput(fetchedProfile.titular_data_nascimento),
        })
      } else {
        // Could set default empty strings or leave as is for placeholder
        setProfile({})
      }
      setIsLoading(false)
    }
    fetchProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value === "" ? null : value })) // Store empty as null for DB
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    // Basic validation example (can be expanded with Zod)
    if (!profile.razao_social || !profile.cnpj || !profile.titular_nome_completo || !profile.titular_cpf) {
      setError("Campos obrigatórios (Razão Social, CNPJ, Nome do Titular, CPF do Titular) devem ser preenchidos.")
      setIsSaving(false)
      return
    }

    const result = await updateCompanyProfile(profile)
    if (result.profile) {
      setProfile({
        // Update state with potentially new/formatted data from server
        ...result.profile,
        data_abertura: formatDateForInput(result.profile.data_abertura),
        titular_data_nascimento: formatDateForInput(result.profile.titular_data_nascimento),
      })
      setSuccessMessage("Perfil da empresa salvo com sucesso!")
    } else {
      setError(result.error || "Falha ao salvar o perfil.")
    }
    setIsSaving(false)
    setTimeout(() => setSuccessMessage(null), 4000) // Clear success message after a few seconds
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando perfil...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Perfil da Empresa (MEI)
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Insira e gerencie os dados cadastrais do seu Microempreendedor Individual.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Salvar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert
          variant="default"
          className="bg-green-50 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-600 dark:text-green-300"
        >
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Sucesso!</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados da Pessoa Jurídica (MEI)</CardTitle>
          <CardDescription>Informações da sua empresa.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              name="cnpj"
              value={profile.cnpj || ""}
              onChange={handleChange}
              placeholder="XX.XXX.XXX/XXXX-XX"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="razao_social">Razão Social *</Label>
            <Input
              id="razao_social"
              name="razao_social"
              value={profile.razao_social || ""}
              onChange={handleChange}
              placeholder="Nome Completo - MEI"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nome_fantasia">Nome Fantasia (Opcional)</Label>
            <Input
              id="nome_fantasia"
              name="nome_fantasia"
              value={profile.nome_fantasia || ""}
              onChange={handleChange}
              placeholder="Nome da sua marca"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data_abertura">Data de Abertura</Label>
            <Input
              id="data_abertura"
              name="data_abertura"
              type="date"
              value={profile.data_abertura || ""}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="cnaes_principais">CNAE Principal (Atividade)</Label>
            <Input
              id="cnaes_principais"
              name="cnaes_principais"
              value={profile.cnaes_principais || ""}
              onChange={handleChange}
              placeholder="Ex: 47.81-4-00 - Comércio varejista de artigos do vestuário e acessórios"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="cnaes_secundarios">CNAEs Secundários (Opcional)</Label>
            <Input
              id="cnaes_secundarios"
              name="cnaes_secundarios"
              value={profile.cnaes_secundarios || ""}
              onChange={handleChange}
              placeholder="Outras atividades, separadas por vírgula"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço Comercial</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="logradouro">Logradouro (Rua, Av.)</Label>
            <Input id="logradouro" name="logradouro" value={profile.logradouro || ""} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" name="numero" value={profile.numero || ""} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="complemento">Complemento (Opcional)</Label>
            <Input id="complemento" name="complemento" value={profile.complemento || ""} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" name="bairro" value={profile.bairro || ""} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" name="cidade" value={profile.cidade || ""} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uf">UF (Estado)</Label>
            <Input
              id="uf"
              name="uf"
              value={profile.uf || ""}
              onChange={handleChange}
              maxLength={2}
              placeholder="Ex: SP"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cep">CEP</Label>
            <Input id="cep" name="cep" value={profile.cep || ""} onChange={handleChange} placeholder="XXXXX-XXX" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="telefone_comercial">Telefone Comercial (Opcional)</Label>
            <Input
              id="telefone_comercial"
              name="telefone_comercial"
              type="tel"
              value={profile.telefone_comercial || ""}
              onChange={handleChange}
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email_comercial">E-mail Comercial (Opcional)</Label>
            <Input
              id="email_comercial"
              name="email_comercial"
              type="email"
              value={profile.email_comercial || ""}
              onChange={handleChange}
              placeholder="contato@suaempresa.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Titular (Pessoa Física)</CardTitle>
          <CardDescription>Informações do microempreendedor individual.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="titular_nome_completo">Nome Completo do Titular *</Label>
            <Input
              id="titular_nome_completo"
              name="titular_nome_completo"
              value={profile.titular_nome_completo || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="titular_cpf">CPF do Titular *</Label>
            <Input
              id="titular_cpf"
              name="titular_cpf"
              value={profile.titular_cpf || ""}
              onChange={handleChange}
              placeholder="XXX.XXX.XXX-XX"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="titular_data_nascimento">Data de Nascimento do Titular</Label>
            <Input
              id="titular_data_nascimento"
              name="titular_data_nascimento"
              type="date"
              value={profile.titular_data_nascimento || ""}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="titular_email">E-mail do Titular (Opcional)</Label>
            <Input
              id="titular_email"
              name="titular_email"
              type="email"
              value={profile.titular_email || ""}
              onChange={handleChange}
              placeholder="seuemail@dominio.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="titular_telefone">Telefone do Titular (Opcional)</Label>
            <Input
              id="titular_telefone"
              name="titular_telefone"
              type="tel"
              value={profile.titular_telefone || ""}
              onChange={handleChange}
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button type="submit" size="lg" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          {isSaving ? "Salvando..." : "Salvar Perfil da Empresa"}
        </Button>
      </div>
    </form>
  )
}
