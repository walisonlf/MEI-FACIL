export interface Transaction {
  id: string
  created_at?: string
  description: string
  amount: number
  date: string // YYYY-MM-DD
  type: "income" | "expense"
  category?: string | null
  attachment_url?: string | null
  attachment_filename?: string | null
}

export interface MeiSettings {
  id: string
  das_paid_this_month: boolean
  updated_at?: string
}

export type UserPlan = "free" | "paid"

export interface User {
  id: string
  email: string
  plan: UserPlan
  stripe_customer_id?: string | null
  created_at?: string
  updated_at?: string
}

export const INCOME_CATEGORIES = [
  "Venda de Produtos",
  "Prestação de Serviços",
  "Consultoria",
  "Aluguel de Bens",
  "Rendimentos de Aplicações",
  "Outras Receitas",
] as const

export const EXPENSE_CATEGORIES = [
  "Compras de Mercadorias/Insumos",
  "Aluguel (Espaço/Equipamento)",
  "Água, Luz, Internet, Telefone",
  "Transporte/Combustível",
  "Marketing/Publicidade",
  "Taxas e Impostos (exceto DAS)",
  "Software/Ferramentas Online",
  "Manutenção (Equipamentos/Veículo)",
  "Material de Escritório",
  "Serviços de Terceiros (Contador, Designer)",
  "Despesas Bancárias",
  "Pró-labore/Salário (se aplicável)",
  "Outras Despesas",
] as const

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface MonthlySummary {
  month: string
  Receitas: number
  Despesas: number
  Saldo: number
}

export interface CategorySummary {
  name: string
  value: number
}

// Corresponds to the company_profiles table
export interface CompanyProfile {
  id: string
  user_id?: string | null // Assuming it can be null if no user system or for a global profile
  cnpj?: string | null
  razao_social?: string | null
  nome_fantasia?: string | null
  data_abertura?: string | null // YYYY-MM-DD
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
  cep?: string | null
  telefone_comercial?: string | null
  email_comercial?: string | null
  cnaes_principais?: string | null // Could be JSON string or comma-separated
  cnaes_secundarios?: string | null
  titular_nome_completo?: string | null
  titular_cpf?: string | null
  titular_data_nascimento?: string | null // YYYY-MM-DD
  titular_email?: string | null
  titular_telefone?: string | null
  created_at?: string
  updated_at?: string
}

export interface DateRange {
  from: string | undefined // YYYY-MM-DD
  to: string | undefined // YYYY-MM-DD
}

export interface ReportFilters {
  dateRange: DateRange
  transactionTypes: Array<"income" | "expense">
  categories: string[] // Selected category names
  amountMin?: number
  amountMax?: number
  descriptionContains?: string
}

// For future use when saving reports
export interface SavedReportConfig {
  id?: string
  report_name: string
  filters: ReportFilters
  selected_fields: string[]
  visualization_type: "table" | "line_chart" | "pie_chart_expenses" | "pie_chart_income" | "default_dashboard_layout" // Added default
  visualization_config?: Record<string, any>
}
