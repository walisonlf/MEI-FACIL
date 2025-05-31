"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { FolderDown, Trash2, Edit3 } from "lucide-react" // Added Edit3
import type { SavedReportConfig } from "@/lib/types"

interface LoadReportDropdownProps {
  savedReports: SavedReportConfig[]
  onLoadReport: (reportConfig: SavedReportConfig) => void
  onEditReport: (reportConfig: SavedReportConfig) => void // New prop
  onDeleteReport: (reportId: string) => void
  disabled?: boolean
}

export function LoadReportDropdown({
  savedReports,
  onLoadReport,
  onEditReport, // New prop
  onDeleteReport,
  disabled,
}: LoadReportDropdownProps) {
  if (savedReports.length === 0 && !disabled) {
    return (
      <Button variant="outline" disabled>
        <FolderDown className="mr-2 h-4 w-4" />
        Carregar Relatório (Nenhum salvo)
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || savedReports.length === 0}>
          <FolderDown className="mr-2 h-4 w-4" />
          Carregar Relatório Salvo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Meus Relatórios Salvos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {savedReports.length === 0 && <DropdownMenuItem disabled>Nenhum relatório salvo</DropdownMenuItem>}
        <DropdownMenuGroup>
          {savedReports.map((report) => (
            <DropdownMenuSub key={report.id}>
              <DropdownMenuSubTrigger className="flex justify-between items-center">
                <span className="truncate flex-1 pr-2" title={report.report_name}>
                  {report.report_name}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => onLoadReport(report)}>
                    <FolderDown className="mr-2 h-4 w-4" />
                    Carregar este relatório
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditReport(report)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Editar este relatório
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDeleteReport(report.id!)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir relatório
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
