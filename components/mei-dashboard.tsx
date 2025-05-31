"use client"

import type React from "react"
import { useState, useMemo, useEffect, useOptimistic, startTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Trash2,
  FileTextIcon,
  Info,
  Loader2,
  BookOpenCheck,
  Settings,
  LogOut,
  Users,
  Mail,
  DownloadCloud,
  BarChartBig,
  Lock,
  Zap,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Paperclip,
  FileSpreadsheet,
  FileBarChart,
  MessageSquare,
  BadgePercent,
  CreditCard,
  XCircle,
} from "lucide-react"
import type { Transaction, MeiSettings, UserPlan } from "@/lib/types"
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/types"
import {
  getTransactions,
  addTransactionAction,
  deleteTransaction,
  getMeiSettings,
  updateDasStatus,
} from "@/app/actions"
import { signOutAction } from "@/app/auth/actions"; // The server action
import Link from "next/link"
import { useRouter } from "next/navigation" // For redirection
import jsPDF from "jspdf"
import { applyPlugin } from "jspdf-autotable"

applyPlugin(jsPDF)

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable
}

const MAX_FREE_TRANSACTIONS = 50
const WHATSAPP_NUMBER = "5531991953885"
const SUPPORT_EMAIL = "wfcontabilidade.online@gmail.com"
const DAS_PAYMENT_URL = "https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao"
const DASN_SUBMISSION_URL =
  "https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/dasnsimei.app/Identificacao"

function escapeCsvField(field: any): string {
  if (field == null) return ""
  const stringField = String(field)
  if (stringField.search(/("|,|\n)/g) >= 0) {
    return `"${stringField.replace(/"/g, '""')}"`
  }
  return stringField
}

export default function MeiDashboardComponent({
  userPlan = "free",
  isAdmin = false,
}: {
  userPlan?: UserPlan
  isAdmin?: boolean
}) {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [optimisticTransactions, setOptimisticTransactions] = useOptimistic<
    Transaction[],
    Omit<Transaction, "id" | "created_at"> & { attachmentFile?: File }
  >(transactions, (state, newTransactionData) => {
    const tempId = `optimistic-${Date.now()}`
    const optimisticEntry: Transaction = {
      ...newTransactionData,
      id: tempId,
      created_at: new Date().toISOString(),
      amount: Number(newTransactionData.amount),
      attachment_url: newTransactionData.attachmentFile ? URL.createObjectURL(newTransactionData.attachmentFile) : null,
      attachment_filename: newTransactionData.attachmentFile?.name || null,
    }
    return [...state, optimisticEntry]
  })

  const [meiSettings, setMeiSettings] = useState<MeiSettings | null>(null)
  const [optimisticDasPaid, setOptimisticDasPaid] = useOptimistic<boolean>(meiSettings?.das_paid_this_month ?? false)
  const [isUpdatingDasStatus, setIsUpdatingDasStatus] = useState(false) // New state for DAS update loading

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [type, setType] = useState<"income" | "expense">("income")
  const [category, setCategory] = useState<string>("")
  const [attachment, setAttachment] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const annualLimit = 81000
  const hasProAccess = userPlan === "paid" || isAdmin
  const currentTransactionCount = transactions.length
  const canAddMoreTransactions = hasProAccess || currentTransactionCount < MAX_FREE_TRANSACTIONS

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setDashboardError(null)
      try {
        const [fetchedTransactions, fetchedSettings] = await Promise.all([getTransactions(), getMeiSettings()])
        setTransactions(fetchedTransactions)
        setMeiSettings(fetchedSettings)
        if (fetchedSettings) {
          startTransition(() => {
            setOptimisticDasPaid(fetchedSettings.das_paid_this_month)
          })
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        setDashboardError("Falha ao carregar os dados do painel. Tente recarregar a página.")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const result = await signOutAction();
    if (result.error) {
      console.error("Logout error:", result.error);
      // Optionally, show an alert to the user:
      // alert(`Erro ao sair: ${result.error}`);
      // Fallthrough to redirect anyway to ensure client state is cleared.
    }
    router.push("/login");
    router.refresh(); // Force a refresh to clear any cached user data on the client
    // setIsLoggingOut(false); // Component will unmount or redirect, so not strictly necessary
  };

  const resetForm = () => {
    setDescription("")
    setAmount("")
    setDate(new Date().toISOString().split("T")[0])
    setCategory("")
    setAttachment(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setFormError(null)
  }

  const handleAddTransactionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    if (!canAddMoreTransactions) {
      setFormError(
        `Você atingiu o limite de ${MAX_FREE_TRANSACTIONS} transações para o plano gratuito. Faça upgrade para transações ilimitadas.`,
      )
      return
    }
    if (!description || !amount || !date || !category) {
      setFormError("Preencha todos os campos obrigatórios (Descrição, Valor, Data, Categoria).")
      return
    }
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("description", description)
    formData.append("amount", amount)
    formData.append("date", date)
    formData.append("type", type)
    formData.append("category", category)
    if (attachment) formData.append("attachment", attachment)

    startTransition(() => {
      setOptimisticTransactions({
        description,
        amount: Number.parseFloat(amount),
        date,
        type,
        category,
        attachmentFile: attachment || undefined,
      } as Omit<Transaction, "id" | "created_at"> & { attachmentFile?: File })
    })

    const result = await addTransactionAction(formData)
    if (result.transaction) {
      const updatedTransactions = await getTransactions()
      setTransactions(updatedTransactions)
      resetForm()
    } else {
      setFormError(result.error || result.blobError || "Falha ao adicionar transação.")
      const updatedTransactions = await getTransactions() // Fetch again to revert optimistic update if error
      setTransactions(updatedTransactions)
    }
    setIsSubmitting(false)
  }

  const handleDeleteTransaction = async (id: string) => {
    const originalTransactions = transactions
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    const success = await deleteTransaction(id)
    if (!success) {
      alert("Falha ao excluir transação.")
      setTransactions(originalTransactions)
    } else {
      const updatedTransactions = await getTransactions()
      setTransactions(updatedTransactions)
    }
  }

  const handleToggleDasStatus = async () => {
    if (!meiSettings || isUpdatingDasStatus) return
    setIsUpdatingDasStatus(true)
    const newStatus = !optimisticDasPaid
    startTransition(() => setOptimisticDasPaid(newStatus))
    const updatedSettings = await updateDasStatus(newStatus)
    if (updatedSettings) {
      setMeiSettings(updatedSettings)
    } else {
      alert("Falha ao atualizar status do DAS.")
      startTransition(() => setOptimisticDasPaid(meiSettings.das_paid_this_month)) // Revert optimistic update
    }
    setIsUpdatingDasStatus(false)
  }

  const { totalIncome, totalExpenses, netBalance, annualRevenue } = useMemo(() => {
    let income = 0,
      expenses = 0
    transactions.forEach((t) => (t.type === "income" ? (income += t.amount) : (expenses += t.amount)))
    return { totalIncome: income, totalExpenses: expenses, netBalance: income - expenses, annualRevenue: income }
  }, [transactions])

  const revenueProgress = useMemo(
    () => (annualLimit === 0 ? 0 : (annualRevenue / annualLimit) * 100),
    [annualRevenue, annualLimit],
  )

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const displayTransactions =
    optimisticTransactions.length > transactions.length ? optimisticTransactions : transactions
  const incomeTransactions = displayTransactions.filter((t) => t.type === "income")
  const expenseTransactions = displayTransactions.filter((t) => t.type === "expense")

  const currentMonthName = new Date().toLocaleString("pt-BR", { month: "long" })
  const currentMonthTitleCased = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)

  const getDasDueDateInfo = () => {
    if (isLoading || meiSettings === null) {
      return <p className="text-sm text-muted-foreground mt-2">Verificando status do DAS...</p>
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    const dueDateThisMonth = new Date(currentYear, currentMonth, 20)
    dueDateThisMonth.setHours(0, 0, 0, 0)

    if (optimisticDasPaid)
      return <p className="text-sm text-green-600 mt-2">DAS de {currentMonthTitleCased} está pago.</p>
    if (today.getTime() < dueDateThisMonth.getTime()) {
      const diffTime = Math.abs(dueDateThisMonth.getTime() - today.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return (
        <p className="text-sm text-orange-600 mt-2">
          Faltam {diffDays} dia(s) para o vencimento do DAS de {currentMonthTitleCased}.
        </p>
      )
    } else if (today.getTime() === dueDateThisMonth.getTime()) {
      return <p className="text-sm text-red-600 font-bold mt-2">DAS de {currentMonthTitleCased} vence HOJE!</p>
    } else {
      return (
        <p className="text-sm text-red-600 mt-2">
          DAS de {currentMonthTitleCased} venceu em 20/{currentMonth + 1}/{currentYear}. Pague o quanto antes!
        </p>
      )
    }
  }
  const getDasnInfo = () => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const dasnYearReference = currentYear - 1
    const dasnDueDate = new Date(currentYear, 4, 31) // May 31st
    today.setHours(0, 0, 0, 0)
    dasnDueDate.setHours(0, 0, 0, 0)
    const isDasnPeriod = today.getMonth() >= 0 && today.getMonth() <= 4 // Jan to May

    const dasnAlertContent = (
      <>
        {isDasnPeriod ? (
          today.getTime() <= dasnDueDate.getTime() ? (
            <>
              A declaração referente a {dasnYearReference} deve ser entregue até 31 de Maio de {currentYear}. Faltam{" "}
              {Math.ceil(Math.abs(dasnDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} dia(s).
            </>
          ) : (
            <>
              O prazo para a declaração referente a {dasnYearReference} encerrou em 31 de Maio de {currentYear}.
              Regularize sua situação.
            </>
          )
        ) : (
          <>
            O período de entrega da DASN-SIMEI referente a {dasnYearReference} foi de Janeiro a Maio de {currentYear}. A
            próxima declaração (ref. a {currentYear}) será entre Janeiro e Maio de {currentYear + 1}.
          </>
        )}
        {hasProAccess && " Usuários Pro recebem lembretes detalhados."}
        <Button size="sm" variant="link" asChild className="p-0 h-auto ml-1 text-xs">
          <a href={DASN_SUBMISSION_URL} target="_blank" rel="noopener noreferrer">
            Acessar Portal DASN-SIMEI <ExternalLink className="inline h-3 w-3 ml-1" />
          </a>
        </Button>
      </>
    )

    if (isDasnPeriod) {
      if (today.getTime() <= dasnDueDate.getTime()) {
        return (
          <Alert className="mt-3 bg-sky-100 border-sky-500 text-sky-700 dark:bg-sky-900 dark:border-sky-700 dark:text-sky-300">
            <BookOpenCheck className="h-4 w-4 !text-sky-700 dark:!text-sky-300" />
            <AlertTitle>Prazo da DASN-SIMEI se aproximando!</AlertTitle>
            <AlertDescription>{dasnAlertContent}</AlertDescription>
          </Alert>
        )
      } else {
        return (
          <Alert variant="destructive" className="mt-3">
            <AlertTriangle className="h-4 w-4" /> <AlertTitle>Prazo da DASN-SIMEI Encerrado!</AlertTitle>
            <AlertDescription>{dasnAlertContent}</AlertDescription>
          </Alert>
        )
      }
    } else {
      return (
        <Alert
          variant="default"
          className="mt-3 bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
        >
          <Info className="h-4 w-4" /> <AlertTitle>DASN-SIMEI</AlertTitle>
          <AlertDescription>{dasnAlertContent}</AlertDescription>
        </Alert>
      )
    }
  }

  const handleExportCSV = () => {
    if (!hasProAccess) {
      alert("Este recurso é exclusivo para usuários Pro.")
      return
    }
    const headers = ["ID", "Data", "Descrição", "Tipo", "Categoria", "Valor", "URL Anexo", "Nome Anexo", "Data Criação"]
    const rows = transactions.map((t) => [
      escapeCsvField(t.id),
      escapeCsvField(t.date),
      escapeCsvField(t.description),
      escapeCsvField(t.type),
      escapeCsvField(t.category),
      escapeCsvField(t.amount),
      escapeCsvField(t.attachment_url),
      escapeCsvField(t.attachment_filename),
      escapeCsvField(t.created_at ? new Date(t.created_at).toLocaleString("pt-BR") : ""),
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `mei_facil_transacoes_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (!hasProAccess) {
      alert("Este recurso é exclusivo para usuários Pro.")
      return
    }
    const doc = new jsPDF() as jsPDFWithAutoTable

    doc.setFontSize(18)
    doc.text("Relatório de Transações - MEI Fácil", 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, 14, 29)

    const tableColumn = ["Data", "Descrição", "Tipo", "Categoria", "Valor (R$)"]
    const tableRows: any[][] = []

    transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach((t) => {
        const transactionData = [
          new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR"),
          t.description,
          t.type === "income" ? "Receita" : "Despesa",
          t.category || "-",
          formatCurrency(t.amount).replace("R$", "").trim(),
        ]
        tableRows.push(transactionData)
      })

    doc.autoTable({
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [22, 160, 133] }, // Teal color for header
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 }, // Date
        1: { cellWidth: "auto" }, // Description
        2: { cellWidth: 25 }, // Type
        3: { cellWidth: 35 }, // Category
        4: { cellWidth: 25, halign: "right" }, // Amount
      },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.getNumberOfPages()
        doc.setFontSize(10)
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10,
        )
      },
    })
    doc.save(`mei_facil_transacoes_${new Date().toISOString().split("T")[0]}.pdf`)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl mt-4 font-semibold text-slate-700 dark:text-slate-300">Carregando seus dados...</p>
      </div>
    )
  }

  if (dashboardError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold text-red-700 dark:text-red-400 mb-2">Erro ao Carregar Painel</h2>
        <p className="text-slate-600 dark:text-slate-300 text-center mb-6">{dashboardError}</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    )
  }

  const currentCategories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white dark:bg-slate-800/50 shadow-md sticky top-0 z-40 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary flex items-center">
            <BarChartBig className="h-7 w-7 mr-2" /> MEI Fácil
          </Link>
          <div className="flex items-center space-x-3 sm:space-x-4">
            {isAdmin && (
              <div className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500 text-white">
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Admin
              </div>
            )}
            <span
              className={`text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1 rounded-full ${hasProAccess && !isAdmin ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"}`}
            >
              Plano: {isAdmin ? "Pro (Admin)" : hasProAccess ? "Pro" : "Gratuito"}
            </span>
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400 hover:text-primary">
                <Settings className="h-5 w-5" /> <span className="sr-only">Configurações</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={isLoggingOut} // Disable button when logout is in progress
              className="text-slate-600 dark:text-slate-400 hover:text-primary"
              aria-label="Sair"
            >
              {isLoggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
              <span className="sr-only">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-semibold text-slate-700 dark:text-slate-200">
                <DollarSign className="mr-2 h-5 w-5 text-green-500" /> Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Receitas:</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Despesas:</span>
                <span className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
              </div>
              <hr className="my-1 border-slate-200 dark:border-slate-700" />
              <div className="flex justify-between items-baseline text-lg">
                <span className="font-medium text-slate-700 dark:text-slate-300">Saldo:</span>
                <span className={`font-extrabold ${netBalance >= 0 ? "text-primary" : "text-red-600"}`}>
                  {formatCurrency(netBalance)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-semibold text-slate-700 dark:text-slate-200">
                <BadgePercent className="mr-2 h-5 w-5 text-primary" /> Faturamento Anual
              </CardTitle>
              <CardDescription className="text-xs">Limite MEI: {formatCurrency(annualLimit)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <span className="text-sm text-muted-foreground">Atual: </span>
                <span className="text-lg font-bold">{formatCurrency(annualRevenue)}</span>
              </div>
              <Progress
                value={revenueProgress}
                className={`h-3 ${revenueProgress > 80 ? (revenueProgress > 95 ? "bg-red-500/80" : "bg-yellow-500/80") : "bg-green-500/80"}`}
                indicatorClassName={`${revenueProgress > 80 ? (revenueProgress > 95 ? "bg-red-500" : "bg-yellow-500") : "bg-green-500"}`}
              />
              <p className="text-xs text-muted-foreground mt-1.5">{revenueProgress.toFixed(1)}% do limite</p>
              {revenueProgress > 80 && (
                <Alert
                  variant={revenueProgress > 95 ? "destructive" : "default"}
                  className="mt-3 p-2 text-xs bg-yellow-50 border-yellow-400 text-yellow-700 dark:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-300"
                >
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription>
                    {revenueProgress > 95 ? "Limite quase excedido!" : "Atenção ao limite!"}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-semibold text-slate-700 dark:text-slate-200">
                <CreditCard className="mr-2 h-5 w-5 text-orange-500" /> DAS Mensal
              </CardTitle>
              <CardDescription className="text-xs">{currentMonthTitleCased} vence dia 20.</CardDescription>
            </CardHeader>
            <CardContent>
              {optimisticDasPaid ? (
                <Alert className="p-2 text-xs bg-green-50 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300">
                  <CheckCircle className="h-3 w-3" />
                  <AlertDescription>DAS deste mês pago.</AlertDescription>
                </Alert>
              ) : (
                <Alert className="p-2 text-xs bg-orange-50 border-orange-400 text-orange-700 dark:bg-orange-900/50 dark:border-orange-700 dark:text-orange-300">
                  <Info className="h-3 w-3" />
                  <AlertDescription>Pagamento pendente.</AlertDescription>
                </Alert>
              )}
              <div className="text-xs mt-1.5">{getDasDueDateInfo()}</div>
              <div className="flex flex-col space-y-2 mt-3">
                <Button
                  onClick={handleToggleDasStatus}
                  className="w-full text-xs h-8"
                  variant={optimisticDasPaid ? "outline" : "default"}
                  disabled={meiSettings === null || isUpdatingDasStatus}
                  size="sm"
                >
                  {isUpdatingDasStatus ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : optimisticDasPaid ? (
                    <XCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  {isUpdatingDasStatus ? "Atualizando..." : optimisticDasPaid ? "Marcar Não Pago" : "Marcar Pago"}
                </Button>
                <Button variant="link" size="sm" asChild className="text-xs p-0 h-auto">
                  <a href={DAS_PAYMENT_URL} target="_blank" rel="noopener noreferrer">
                    Gerar Guia DAS (PGMEI) <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-semibold text-slate-700 dark:text-slate-200">
                <BookOpenCheck className="mr-2 h-5 w-5 text-sky-500" /> DASN Anual
              </CardTitle>
              <CardDescription className="text-xs">Declaração Anual (SIMEI)</CardDescription>
            </CardHeader>
            <CardContent className="text-xs">{getDasnInfo()}</CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Adicionar Nova Transação</CardTitle>
            {!hasProAccess && (
              <CardDescription>
                Plano Gratuito: {currentTransactionCount} de {MAX_FREE_TRANSACTIONS} transações registradas.
                {!canAddMoreTransactions && <span className="text-red-500 ml-1">Limite atingido.</span>}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            {!canAddMoreTransactions ? (
              <Alert className="bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:border-primary/50">
                <Zap className="h-4 w-4" /> <AlertTitle>Limite de Transações Atingido!</AlertTitle>
                <AlertDescription>
                  Você utilizou todas as {MAX_FREE_TRANSACTIONS} transações do plano gratuito.{" "}
                  <Link href="/#pricing" className="font-semibold underline ml-1 hover:text-primary/80">
                    Faça upgrade para o plano Pro
                  </Link>{" "}
                  para transações ilimitadas!
                </AlertDescription>
              </Alert>
            ) : (
              <form
                onSubmit={handleAddTransactionSubmit}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start"
              >
                <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                  <Label htmlFor="description" className="text-sm">
                    Descrição *
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Venda de produto X"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-sm">
                    Valor (R$) *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 150.00"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-sm">
                    Data *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-sm">
                    Categoria *
                  </Label>
                  <Select value={category} onValueChange={setCategory} disabled={isSubmitting} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="attachment" className="text-sm">
                    Anexo (Opcional, máx 4.5MB)
                  </Label>
                  <Input
                    id="attachment"
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)}
                    className="pt-2 text-xs"
                    disabled={isSubmitting}
                  />
                  {attachment && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecionado: {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 items-end md:col-span-2 lg:col-span-3 lg:flex-row lg:justify-start lg:gap-4">
                  <div className="flex space-x-2 items-end">
                    <Button
                      type="button"
                      variant={type === "income" ? "default" : "outline"}
                      onClick={() => {
                        setType("income")
                        setCategory("")
                      }}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" /> Receita
                    </Button>
                    <Button
                      type="button"
                      variant={type === "expense" ? "default" : "outline"}
                      onClick={() => {
                        setType("expense")
                        setCategory("")
                      }}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      <TrendingDown className="mr-2 h-4 w-4" /> Despesa
                    </Button>
                  </div>
                  <Button type="submit" className="w-full lg:w-auto py-3 text-base" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {isSubmitting ? "Adicionando..." : "Adicionar Transação"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold">
                <FileBarChart className="mr-2 h-5 w-5 text-primary" /> Relatórios Avançados
              </CardTitle>
              {!hasProAccess && <CardDescription className="text-xs">Disponível no Plano Pro</CardDescription>}
            </CardHeader>
            <CardContent>
              {hasProAccess ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Acesse análises detalhadas para insights profundos sobre suas finanças.
                  </p>
                  <Link href="/dashboard/reports">
                    <Button
                      variant="default"
                      className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Ver Relatórios Detalhados <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Desbloqueie relatórios detalhados.</p>
                  <Link href="/#pricing">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Fazer Upgrade para Pro
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold">
                <DownloadCloud className="mr-2 h-5 w-5 text-primary" /> Exportação de Dados
              </CardTitle>
              {!hasProAccess && <CardDescription className="text-xs">Disponível no Plano Pro</CardDescription>}
            </CardHeader>
            <CardContent>
              {hasProAccess ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Exporte suas transações para análise ou contabilidade.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleExportCSV}
                      className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar (CSV)
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <FileTextIcon className="mr-2 h-4 w-4" /> Exportar (PDF)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Tenha seus dados sempre à mão.</p>
                  <Link href="/#pricing">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Fazer Upgrade para Pro
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold">
                <TrendingUp className="mr-2 h-5 w-5 text-green-500" /> Histórico de Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">Nenhuma receita registrada.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Descrição</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-right text-xs">Valor</TableHead>
                      <TableHead className="text-center text-xs">Anexo</TableHead>
                      <TableHead className="text-right text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeTransactions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((t) => (
                        <TableRow
                          key={t.id}
                          className={`${t.id.startsWith("optimistic-") ? "opacity-60 italic" : ""} text-sm`}
                        >
                          <TableCell>{new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="truncate max-w-[150px] sm:max-w-xs" title={t.description}>
                            {t.description}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{t.category || "-"}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {formatCurrency(t.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {t.attachment_url ? (
                              <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                                <a
                                  href={t.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={t.attachment_filename || "Ver anexo"}
                                >
                                  <Paperclip className="h-4 w-4 text-primary" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTransaction(t.id)}
                              disabled={t.id.startsWith("optimistic-")}
                              className="h-7 w-7"
                            >
                              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold">
                <TrendingDown className="mr-2 h-5 w-5 text-red-500" /> Histórico de Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">Nenhuma despesa registrada.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Descrição</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-right text-xs">Valor</TableHead>
                      <TableHead className="text-center text-xs">Anexo</TableHead>
                      <TableHead className="text-right text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseTransactions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((t) => (
                        <TableRow
                          key={t.id}
                          className={`${t.id.startsWith("optimistic-") ? "opacity-60 italic" : ""} text-sm`}
                        >
                          <TableCell>{new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="truncate max-w-[150px] sm:max-w-xs" title={t.description}>
                            {t.description}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{t.category || "-"}</TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {formatCurrency(t.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {t.attachment_url ? (
                              <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                                <a
                                  href={t.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={t.attachment_filename || "Ver anexo"}
                                >
                                  <Paperclip className="h-4 w-4 text-primary" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTransaction(t.id)}
                              disabled={t.id.startsWith("optimistic-")}
                              className="h-7 w-7"
                            >
                              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <HelpCircle className="mr-2 h-5 w-5 text-primary" /> Precisa de Ajuda?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                <Users className="h-4 w-4 mr-2 text-primary" /> Suporte à Comunidade
              </h4>
              <p className="text-muted-foreground mb-2 text-xs">Acesse nosso fórum (Gratuito e Pro).</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="#" target="_blank" rel="noopener noreferrer">
                  Acessar Fórum <ExternalLink className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-green-500" /> WhatsApp {hasProAccess ? "(Prioritário)" : ""}
              </h4>
              <p className="text-muted-foreground mb-2 text-xs">
                {hasProAccess ? "Suporte rápido via WhatsApp." : "Disponível no Plano Pro."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                asChild={hasProAccess}
                disabled={!hasProAccess}
              >
                <Link
                  href={
                    hasProAccess
                      ? `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%2C%20sou%20usu%C3%A1rio%20Pro%20do%20MEI%20F%C3%A1cil%20e%20preciso%20de%20ajuda.`
                      : "/#pricing"
                  }
                  target={hasProAccess ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                >
                  {hasProAccess ? "Iniciar Chat" : "Ver Planos Pro"} <ExternalLink className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-accent" /> E-mail {hasProAccess ? "(Prioritário)" : ""}
              </h4>
              <p className="text-muted-foreground mb-2 text-xs">
                {hasProAccess ? "Suporte prioritário por e-mail." : "Disponível no Plano Pro."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className={`${hasProAccess ? "border-accent text-accent-focus hover:bg-accent/10" : ""} disabled:opacity-50 disabled:cursor-not-allowed`}
                asChild={hasProAccess}
                disabled={!hasProAccess}
              >
                <Link
                  href={hasProAccess ? `mailto:${SUPPORT_EMAIL}?subject=Suporte%20MEI%20Fácil%20Pro` : "/#pricing"}
                  target={hasProAccess ? "_blank" : "_self"}
                >
                  {hasProAccess ? "Contatar por E-mail" : "Ver Planos Pro"} <ExternalLink className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="text-center py-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          &copy; {new Date().getFullYear()} MEI Fácil. Painel de Controle.
        </p>
      </footer>
    </div>
  )
}
