"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Edit3 } from "lucide-react" // Added Edit3
import type { SavedReportConfig } from "@/lib/types"

interface SaveReportDialogProps {
  onSave: (reportName: string, reportId?: string) => void
  triggerButton?: React.ReactNode // Allow custom trigger
  existingReport?: SavedReportConfig | null
  disabled?: boolean
  isOpen?: boolean // Make isOpen a prop for external control
  onOpenChange?: (open: boolean) => void // Make onOpenChange a prop
}

export function SaveReportDialog({
  onSave,
  triggerButton,
  existingReport,
  disabled,
  isOpen: controlledIsOpen, // Renamed for clarity
  onOpenChange: controlledOnOpenChange, // Renamed for clarity
}: SaveReportDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [reportName, setReportName] = useState("")

  const isEditing = !!existingReport

  // Determine if the dialog's open state is controlled externally or internally
  const isExternallyControlled = controlledIsOpen !== undefined
  const currentIsOpen = isExternallyControlled ? controlledIsOpen : internalIsOpen
  const setCurrentIsOpen = isExternallyControlled ? controlledOnOpenChange! : setInternalIsOpen

  useEffect(() => {
    if (currentIsOpen) {
      // Only update name if dialog is opening or open
      if (isEditing && existingReport) {
        setReportName(existingReport.report_name)
      } else {
        setReportName("") // Reset for new report when dialog opens
      }
    }
  }, [isEditing, existingReport, currentIsOpen]) // Depend on currentIsOpen

  const handleSave = () => {
    if (reportName.trim()) {
      onSave(reportName.trim(), existingReport?.id)
      // setReportName("") // Clearing name is handled by useEffect on open
      setCurrentIsOpen(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" disabled={disabled}>
      <Save className="mr-2 h-4 w-4" />
      Salvar Relatório Atual
    </Button>
  )

  return (
    <Dialog open={currentIsOpen} onOpenChange={setCurrentIsOpen}>
      {triggerButton ? (
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      ) : (
        // Only render default trigger if not externally controlled AND not in editing mode (via existingReport)
        !isExternallyControlled && !isEditing && <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Relatório Salvo" : "Salvar Configuração do Relatório"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize o nome deste relatório. Os filtros atuais serão aplicados."
              : "Dê um nome para esta configuração de relatório para usá-la novamente mais tarde."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="report-name" className="text-right">
              Nome
            </Label>
            <Input
              id="report-name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Despesas Trimestrais"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" onClick={() => setCurrentIsOpen(false)}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={!reportName.trim()}>
            {isEditing ? <Edit3 className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {isEditing ? "Atualizar Relatório" : "Salvar Relatório"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
