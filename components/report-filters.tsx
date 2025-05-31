"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, FilterIcon, XIcon, ChevronDown } from "lucide-react"
import { format, isValid, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ReportFilters } from "@/lib/types"
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ReportFiltersProps {
  initialFilters: ReportFilters
  onApplyFilters: (filters: ReportFilters) => void
  allTransactionYears: string[] // For the year dropdown, if we keep it temporarily
}

const ALL_POSSIBLE_CATEGORIES = Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]))

export function ReportFiltersComponent({ initialFilters, onApplyFilters, allTransactionYears }: ReportFiltersProps) {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    // Initial selectedYear logic (can be simplified or adjusted based on new useEffect)
    const currentYear = new Date().getFullYear().toString()
    if (initialFilters.dateRange.from) {
      return new Date(initialFilters.dateRange.from + "T00:00:00").getFullYear().toString()
    }
    return allTransactionYears.includes(currentYear) ? currentYear : allTransactionYears[0] || currentYear
  })

  // Add this useEffect to synchronize with initialFilters prop changes
  useEffect(() => {
    setFilters(initialFilters)

    let yearToSetBasedOnFilters = new Date().getFullYear().toString()
    if (initialFilters.dateRange.from) {
      const yearFromFilters = new Date(initialFilters.dateRange.from + "T00:00:00").getFullYear().toString()
      if (allTransactionYears.includes(yearFromFilters)) {
        yearToSetBasedOnFilters = yearFromFilters
      } else if (allTransactionYears.length > 0) {
        yearToSetBasedOnFilters = allTransactionYears[0] // Fallback to most recent available
      }
      // If yearFromFilters is not in allTransactionYears and allTransactionYears is empty, it defaults to current year
    } else if (allTransactionYears.length > 0) {
      // If no dateRange.from, but years are available, use most recent or current.
      yearToSetBasedOnFilters = allTransactionYears.includes(yearToSetBasedOnFilters)
        ? yearToSetBasedOnFilters
        : allTransactionYears[0]
    }
    // If allTransactionYears is empty and no dateRange.from, yearToSetBasedOnFilters remains current year.
    setSelectedYear(yearToSetBasedOnFilters)
  }, [initialFilters, allTransactionYears])

  const handleDateChange = (date: Date | undefined, field: "from" | "to") => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: date ? format(date, "yyyy-MM-dd") : undefined,
      },
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? undefined : Number.parseFloat(value)) : value,
    }))
  }

  const handleTransactionTypeChange = (type: "income" | "expense") => {
    setFilters((prev) => {
      const newTypes = prev.transactionTypes.includes(type)
        ? prev.transactionTypes.filter((t) => t !== type)
        : [...prev.transactionTypes, type]
      return { ...prev, transactionTypes: newTypes }
    })
  }

  const handleCategoryChange = (category: string) => {
    setFilters((prev) => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category]
      return { ...prev, categories: newCategories }
    })
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    // Update dateRange to reflect the full year
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onApplyFilters(filters)
  }

  const clearFilters = () => {
    const currentYear = new Date().getFullYear().toString()
    const defaultYear = allTransactionYears.includes(currentYear) ? currentYear : allTransactionYears[0] || currentYear
    const clearedFilters: ReportFilters = {
      dateRange: { from: `${defaultYear}-01-01`, to: `${defaultYear}-12-31` },
      transactionTypes: ["income", "expense"],
      categories: [],
      amountMin: undefined,
      amountMax: undefined,
      descriptionContains: undefined,
    }
    setFilters(clearedFilters)
    setSelectedYear(defaultYear)
    onApplyFilters(clearedFilters) // Apply cleared filters immediately
  }

  const parseDateSafe = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined
    const date = parseISO(dateString)
    return isValid(date) ? date : undefined
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 md:p-6 space-y-6 bg-card text-card-foreground rounded-lg border shadow-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        {/* Year Selector - Kept for quick year-wide filtering */}
        <div className="space-y-1.5">
          <Label htmlFor="year-select">Ano Fiscal</Label>
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger id="year-select">
              <SelectValue placeholder="Selecione o Ano" />
            </SelectTrigger>
            <SelectContent>
              {allTransactionYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range From */}
        <div className="space-y-1.5">
          <Label htmlFor="date-from">Data Inicial</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-from"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateRange.from && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? (
                  format(parseDateSafe(filters.dateRange.from) || new Date(), "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={parseDateSafe(filters.dateRange.from)}
                onSelect={(date) => handleDateChange(date, "from")}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Range To */}
        <div className="space-y-1.5">
          <Label htmlFor="date-to">Data Final</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-to"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateRange.to && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.to ? (
                  format(parseDateSafe(filters.dateRange.to) || new Date(), "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={parseDateSafe(filters.dateRange.to)}
                onSelect={(date) => handleDateChange(date, "to")}
                initialFocus
                locale={ptBR}
                disabled={{ before: parseDateSafe(filters.dateRange.from) }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Transaction Types */}
        <div className="space-y-1.5">
          <Label>Tipos de Transação</Label>
          <div className="flex items-center space-x-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="type-income"
                checked={filters.transactionTypes.includes("income")}
                onCheckedChange={() => handleTransactionTypeChange("income")}
              />
              <Label htmlFor="type-income" className="font-normal">
                Receitas
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="type-expense"
                checked={filters.transactionTypes.includes("expense")}
                onCheckedChange={() => handleTransactionTypeChange("expense")}
              />
              <Label htmlFor="type-expense" className="font-normal">
                Despesas
              </Label>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-1.5">
          <Label>Categorias</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {filters.categories.length > 0 ? `${filters.categories.length} selecionada(s)` : "Todas as Categorias"}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
              <DropdownMenuLabel>Selecionar Categorias</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_POSSIBLE_CATEGORIES.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => handleCategoryChange(category)}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Amount Min */}
        <div className="space-y-1.5">
          <Label htmlFor="amountMin">Valor Mínimo (R$)</Label>
          <Input
            id="amountMin"
            name="amountMin"
            type="number"
            placeholder="Ex: 50.00"
            value={filters.amountMin ?? ""}
            onChange={handleInputChange}
            step="0.01"
          />
        </div>

        {/* Amount Max */}
        <div className="space-y-1.5">
          <Label htmlFor="amountMax">Valor Máximo (R$)</Label>
          <Input
            id="amountMax"
            name="amountMax"
            type="number"
            placeholder="Ex: 1000.00"
            value={filters.amountMax ?? ""}
            onChange={handleInputChange}
            step="0.01"
          />
        </div>

        {/* Description Contains */}
        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
          <Label htmlFor="descriptionContains">Descrição Contém</Label>
          <Input
            id="descriptionContains"
            name="descriptionContains"
            type="text"
            placeholder="Palavra-chave na descrição"
            value={filters.descriptionContains ?? ""}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4">
        <Button type="button" variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
          <XIcon className="mr-2 h-4 w-4" /> Limpar Filtros
        </Button>
        <Button type="submit" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
          <FilterIcon className="mr-2 h-4 w-4" /> Aplicar Filtros
        </Button>
      </div>
    </form>
  )
}
