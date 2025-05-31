"use client"

import { useEffect, useState, useMemo, useCallback, startTransition } from "react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTransactions, getSavedReports, upsertReportConfiguration, deleteSavedReport } from "@/app/actions"
import type {
  Transaction,
  MonthlySummary,
  CategorySummary,
  UserPlan,
  ReportFilters,
  SavedReportConfig,
} from "@/lib/types"
import { Loader2, AlertTriangle, ArrowLeft, Lock, FlagIcon as ReportsIcon, Save } from "lucide-react" // Added Save
import Link from "next/link"
import { ReportFiltersComponent } from "@/components/report-filters"
import { SaveReportDialog } from "@/components/save-report-dialog"
import { LoadReportDropdown } from "@/components/load-report-dropdown"
import { parseISO, isWithinInterval, startOfDay, endOfDay, getYear } from "date-fns"
import { useToast } from "@/hooks/use-toast"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82Ca9D", "#FF5733", "#C70039", "#900C3F"]

const getMonthYearLabel = (date: Date): string => {
  return date.toLocaleString("pt-BR", { month: "short", year: "numeric" })
}

const DEFAULT_SELECTED_FIELDS = ["date", "description", "amount", "type", "category"]
const DEFAULT_VISUALIZATION_TYPE: SavedReportConfig["visualization_type"] = "default_dashboard_layout"

export default function AdvancedReportsPage() {
  const { toast } = useToast()
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingReportAction, setIsProcessingReportAction] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentYear = new Date().getFullYear().toString()
  const initialDefaultFilters: ReportFilters = {
    dateRange: { from: `${currentYear}-01-01`, to: `${currentYear}-12-31` },
    transactionTypes: ["income", "expense"],
    categories: [],
    amountMin: undefined,
    amountMax: undefined,
    descriptionContains: undefined,
  }
  const [activeFilters, setActiveFilters] = useState<ReportFilters>(initialDefaultFilters)
  const [savedReports, setSavedReports] = useState<SavedReportConfig[]>([])

  const [isSaveOrEditDialogOpen, setIsSaveOrEditDialogOpen] = useState(false)
  const [reportToEdit, setReportToEdit] = useState<SavedReportConfig | null>(null)

  const [userPlan, setUserPlan] = useState<UserPlan>("paid")
  const [isAdmin, setIsAdmin] = useState<boolean>(true)
  const hasProAccess = userPlan === "paid" || isAdmin

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [fetchedTransactions, fetchedSavedReports] = await Promise.all([getTransactions(), getSavedReports()])
      setAllTransactions(fetchedTransactions)
      setSavedReports(fetchedSavedReports.sort((a, b) => a.report_name.localeCompare(b.report_name)))

      const yearsFromData = Array.from(
        new Set(fetchedTransactions.map((t) => new Date(t.date + "T00:00:00").getFullYear().toString())),
      ).sort((a, b) => Number.parseInt(b) - Number.parseInt(a))
      const defaultYear = yearsFromData.includes(currentYear) ? currentYear : yearsFromData[0] || currentYear

      setActiveFilters((prev) => ({
        ...prev,
        dateRange: { from: `${defaultYear}-01-01`, to: `${defaultYear}-12-31` },
      }))
      setError(null)
    } catch (e) {
      console.error("Failed to fetch initial data for reports:", e)
      setError("Não foi possível carregar os dados dos relatórios.")
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível buscar transações ou relatórios salvos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentYear, toast])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const availableYears = useMemo(() => {
    const years = new Set(allTransactions.map((t) => new Date(t.date + "T00:00:00").getFullYear().toString()))
    return Array.from(years).sort((a, b) => Number.parseInt(b) - Number.parseInt(a))
  }, [allTransactions])

  const handleApplyFilters = useCallback((newFilters: ReportFilters) => {
    setActiveFilters(newFilters)
  }, [])

  const handleUpsertReport = async (reportNameFromDialog: string, reportIdToUpdate?: string) => {
    setIsProcessingReportAction(true)
    const reportConfigPayload: Partial<SavedReportConfig> = {
      id: reportIdToUpdate,
      report_name: reportNameFromDialog,
      filters: activeFilters,
      selected_fields: reportToEdit?.selected_fields || DEFAULT_SELECTED_FIELDS,
      visualization_type: reportToEdit?.visualization_type || DEFAULT_VISUALIZATION_TYPE,
      visualization_config: reportToEdit?.visualization_config || {},
    }

    const result = await upsertReportConfiguration(reportConfigPayload)

    if (result.report) {
      if (result.isUpdate) {
        setSavedReports((prev) =>
          prev
            .map((r) => (r.id === result.report!.id ? result.report! : r))
            .sort((a, b) => a.report_name.localeCompare(b.report_name)),
        )
        toast({
          title: "Relatório Atualizado!",
          description: `"${result.report?.report_name || reportNameFromDialog}" foi atualizado com sucesso.`,
        })
      } else {
        setSavedReports((prev) => [...prev, result.report!].sort((a, b) => a.report_name.localeCompare(b.report_name)))
        toast({
          title: "Relatório Salvo!",
          description: `"${result.report?.report_name || reportNameFromDialog}" foi salvo com sucesso.`,
        })
      }
    } else {
      toast({
        title: `Erro ao ${result.isUpdate ? "Atualizar" : "Salvar"}`,
        description: result.error || `Não foi possível ${result.isUpdate ? "atualizar" : "salvar"} o relatório.`,
        variant: "destructive",
      })
    }
    setIsProcessingReportAction(false)
    setReportToEdit(null)
    setIsSaveOrEditDialogOpen(false) // Close the single dialog
  }

  const handleOpenEditDialog = (reportConfig: SavedReportConfig) => {
    setReportToEdit(reportConfig)
    setIsSaveOrEditDialogOpen(true) // Open the single dialog for editing
  }

  const handleOpenSaveNewDialog = () => {
    setReportToEdit(null) // Ensure it's a new save
    setIsSaveOrEditDialogOpen(true)
  }

  const handleLoadSavedReport = (reportConfig: SavedReportConfig) => {
    startTransition(() => {
      setActiveFilters(reportConfig.filters)
    })
    toast({ title: "Relatório Carregado", description: `Configuração "${reportConfig.report_name}" aplicada.` })
  }

  const handleDeleteSavedReport = async (reportId: string) => {
    setIsProcessingReportAction(true)
    const reportToDelete = savedReports.find((r) => r.id === reportId)
    const result = await deleteSavedReport(reportId)
    if (result.success) {
      setSavedReports((prev) => prev.filter((r) => r.id !== reportId))
      toast({ title: "Relatório Excluído", description: `"${reportToDelete?.report_name}" foi excluído.` })
    } else {
      toast({
        title: "Erro ao Excluir",
        description: result.error || "Não foi possível excluir o relatório.",
        variant: "destructive",
      })
    }
    setIsProcessingReportAction(false)
  }

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      const transactionDate = parseISO(t.date)
      const { from, to } = activeFilters.dateRange
      if (from && to) {
        const startDate = startOfDay(parseISO(from))
        const endDate = endOfDay(parseISO(to))
        if (!isWithinInterval(transactionDate, { start: startDate, end: endDate })) return false
      } else if (from) {
        if (transactionDate < startOfDay(parseISO(from))) return false
      } else if (to) {
        if (transactionDate > endOfDay(parseISO(to))) return false
      }
      if (activeFilters.transactionTypes.length > 0 && !activeFilters.transactionTypes.includes(t.type)) return false
      if (activeFilters.categories.length > 0 && (!t.category || !activeFilters.categories.includes(t.category)))
        return false
      if (activeFilters.amountMin !== undefined && t.amount < activeFilters.amountMin) return false
      if (activeFilters.amountMax !== undefined && t.amount > activeFilters.amountMax) return false
      if (
        activeFilters.descriptionContains &&
        !t.description.toLowerCase().includes(activeFilters.descriptionContains.toLowerCase())
      )
        return false
      return true
    })
  }, [allTransactions, activeFilters])

  const monthlySummary: MonthlySummary[] = useMemo(() => {
    const summary: { [key: string]: { Receitas: number; Despesas: number } } = {}
    filteredTransactions.forEach((t) => {
      const transactionDate = parseISO(t.date)
      const monthYearKey = getMonthYearLabel(transactionDate)
      if (!summary[monthYearKey]) summary[monthYearKey] = { Receitas: 0, Despesas: 0 }
      if (t.type === "income") summary[monthYearKey].Receitas += t.amount
      else summary[monthYearKey].Despesas += t.amount
    })
    return Object.entries(summary)
      .map(([monthYear, data]) => ({
        month: monthYear,
        Receitas: data.Receitas,
        Despesas: data.Despesas,
        Saldo: data.Receitas - data.Despesas,
      }))
      .sort((a, b) => {
        const [aMonStr, aYrStr] = a.month.split(" ")
        const [bMonStr, bYrStr] = b.month.split(" ")
        const aYr = Number.parseInt(aYrStr)
        const bYr = Number.parseInt(bYrStr)
        if (aYr !== bYr) return aYr - bYr
        const monthOrder = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
        return (
          monthOrder.indexOf(aMonStr.toLowerCase().replace(".", "")) -
          monthOrder.indexOf(bMonStr.toLowerCase().replace(".", ""))
        )
      })
  }, [filteredTransactions])

  const expenseByCategory: CategorySummary[] = useMemo(() => {
    const summary: { [key: string]: number } = {}
    filteredTransactions
      .filter((t) => t.type === "expense" && t.category)
      .forEach((t) => {
        summary[t.category!] = (summary[t.category!] || 0) + t.amount
      })
    return Object.entries(summary)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredTransactions])

  const incomeByCategory: CategorySummary[] = useMemo(() => {
    const summary: { [key: string]: number } = {}
    filteredTransactions
      .filter((t) => t.type === "income" && t.category)
      .forEach((t) => {
        summary[t.category!] = (summary[t.category!] || 0) + t.amount
      })
    return Object.entries(summary)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredTransactions])

  if (isLoading && !allTransactions.length) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-xl mt-4 font-semibold text-slate-700 dark:text-slate-300">Carregando relatórios...</p>
      </div>
    )
  }

  if (!hasProAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-8 text-center bg-slate-50 dark:bg-slate-900">
        <Lock className="h-16 w-16 text-primary mb-6" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">Recurso Exclusivo Pro</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          Relatórios avançados são um benefício do plano Pro. Faça upgrade para obter insights detalhados sobre suas
          finanças.
        </p>
        <div className="flex space-x-4">
          <Link href="/#pricing">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Conhecer Planos Pro
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (error && !isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-80px)] p-8 text-center bg-slate-50 dark:bg-slate-900">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">Erro ao Carregar Relatórios</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">{error}</p>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
          </Button>
        </Link>
      </div>
    )
  }

  if (!isLoading && allTransactions.length === 0 && hasProAccess) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-80px)] p-8 text-center bg-slate-50 dark:bg-slate-900">
        <ReportsIcon className="h-16 w-16 text-primary mb-6 opacity-50" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">Nenhuma Transação Encontrada</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          Adicione algumas transações no painel para visualizar os relatórios avançados.
        </p>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
          </Button>
        </Link>
      </div>
    )
  }

  const currentFilterYear = activeFilters.dateRange.from
    ? getYear(parseISO(activeFilters.dateRange.from)).toString()
    : "Período"

  const reportActionsDisabled = isLoading || isProcessingReportAction

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800/50 shadow-sm sticky top-0 z-30 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Voltar ao Painel</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Relatórios Avançados</h1>
          </div>
          <div className="flex items-center space-x-2">
            <LoadReportDropdown
              savedReports={savedReports}
              onLoadReport={handleLoadSavedReport}
              onEditReport={handleOpenEditDialog}
              onDeleteReport={handleDeleteSavedReport}
              disabled={reportActionsDisabled}
            />
            <Button variant="outline" onClick={handleOpenSaveNewDialog} disabled={reportActionsDisabled}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Relatório Atual
            </Button>
            <SaveReportDialog
              onSave={handleUpsertReport}
              existingReport={reportToEdit}
              isOpen={isSaveOrEditDialogOpen}
              onOpenChange={setIsSaveOrEditDialogOpen}
              disabled={reportActionsDisabled}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <ReportFiltersComponent
          initialFilters={activeFilters}
          onApplyFilters={handleApplyFilters}
          allTransactionYears={availableYears.length > 0 ? availableYears : [new Date().getFullYear().toString()]}
        />

        {(isLoading && allTransactions.length > 0) ||
          (isProcessingReportAction && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-slate-600 dark:text-slate-400">
                {isProcessingReportAction ? "Processando ação..." : "Atualizando relatórios..."}
              </p>
            </div>
          ))}

        {!isLoading && !isProcessingReportAction && filteredTransactions.length === 0 && allTransactions.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-10">
                Nenhuma transação encontrada para os filtros aplicados. Tente ajustar seus critérios de busca.
              </p>
            </CardContent>
          </Card>
        )}

        {!isProcessingReportAction && filteredTransactions.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Receitas vs. Despesas Mensais ({currentFilterYear})</CardTitle>
                <CardDescription>
                  Comparativo mensal de suas receitas, despesas e saldo para o período filtrado.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] sm:h-[500px]">
                {monthlySummary.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySummary} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(value) => `R$${value / 1000}k`} />
                      <Tooltip formatter={(value: number) => `R$${value.toFixed(2)}`} />
                      <Legend />
                      <Line type="monotone" dataKey="Receitas" stroke="#00C49F" strokeWidth={2} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Despesas" stroke="#FF8042" strokeWidth={2} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Saldo" stroke="#0088FE" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-10">Nenhum dado para este período e filtros.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Despesas por Categoria ({currentFilterYear})</CardTitle>
                  <CardDescription>
                    Distribuição de suas despesas por categoria para o período filtrado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] sm:h-[500px]">
                  {expenseByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={"80%"}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent! * 100).toFixed(0)}%)`}
                          fontSize={12}
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `R$${value.toFixed(2)}`} />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-10">
                      Nenhuma despesa categorizada neste período e filtros.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Receitas por Categoria ({currentFilterYear})</CardTitle>
                  <CardDescription>
                    Distribuição de suas receitas por categoria para o período filtrado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] sm:h-[500px]">
                  {incomeByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={"80%"}
                          fill="#82ca9d"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent! * 100).toFixed(0)}%)`}
                          fontSize={12}
                        >
                          {incomeByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `R$${value.toFixed(2)}`} />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-10">
                      Nenhuma receita categorizada neste período e filtros.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
      <footer className="text-center py-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          &copy; {new Date().getFullYear()} MEI Fácil. Relatórios Avançados.
        </p>
      </footer>
    </div>
  )
}
