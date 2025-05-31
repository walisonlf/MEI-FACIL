"use server"

import { createClient } from "@/lib/supabase/server"
import type { Transaction, MeiSettings, CompanyProfile, SavedReportConfig } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import type { PutBlobResult } from "@vercel/blob"

const FIXED_MEI_SETTINGS_ID = "00000000-0000-0000-0000-000000000000"
const FIXED_COMPANY_PROFILE_ID_FOR_SIMULATION = "11111111-1111-1111-1111-111111111111"
// const FIXED_USER_ID_FOR_SIMULATION = "22222222-2222-2222-2222-222222222222"; // If simulating a user for reports

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("transactions")
      .select("id, created_at, description, amount, date, type, category, attachment_url, attachment_filename")
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching transactions from Supabase:", error)
      return []
    }
    return data as Transaction[]
  } catch (e) {
    console.error("Unexpected error in getTransactions action:", e)
    return []
  }
}

export async function addTransactionAction(
  formData: FormData,
): Promise<{ transaction: Transaction | null; error?: string; blobError?: string }> {
  try {
    const supabase = createClient()

    const rawTransactionData = {
      description: formData.get("description") as string,
      amount: Number.parseFloat(formData.get("amount") as string),
      date: formData.get("date") as string,
      type: formData.get("type") as "income" | "expense",
      category: formData.get("category") as string | undefined,
    }

    if (!rawTransactionData.description || isNaN(rawTransactionData.amount) || !rawTransactionData.date) {
      return { transaction: null, error: "Dados da transação inválidos." }
    }

    let attachment_url: string | null = null
    let attachment_filename: string | null = null
    const attachmentFile = formData.get("attachment") as File | null

    if (attachmentFile && attachmentFile.size > 0) {
      if (attachmentFile.size > 4.5 * 1024 * 1024) {
        return { transaction: null, error: "Arquivo muito grande. Máximo de 4.5MB." }
      }
      try {
        const blob: PutBlobResult = await put(attachmentFile.name, attachmentFile, {
          access: "public",
        })
        attachment_url = blob.url
        attachment_filename = attachmentFile.name
      } catch (blobUploadError) {
        console.error("Error uploading to Blob:", blobUploadError)
        return { transaction: null, blobError: "Falha ao enviar anexo." }
      }
    }

    const transactionToInsert = {
      ...rawTransactionData,
      category: rawTransactionData.category || null,
      attachment_url,
      attachment_filename,
    }

    const { data, error: dbError } = await supabase.from("transactions").insert([transactionToInsert]).select().single()

    if (dbError) {
      console.error("Error adding transaction to Supabase:", dbError)
      return { transaction: null, error: "Falha ao adicionar transação no banco de dados." }
    }
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")
    return { transaction: data as Transaction }
  } catch (e) {
    console.error("Unexpected error in addTransactionAction:", e)
    return { transaction: null, error: "Ocorreu um erro inesperado ao adicionar a transação." }
  }
}

export async function deleteTransaction(id: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("transactions").delete().match({ id })

    if (error) {
      console.error("Error deleting transaction from Supabase:", error)
      return false
    }
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")
    return true
  } catch (e) {
    console.error("Unexpected error in deleteTransaction action:", e)
    return false
  }
}

export async function getMeiSettings(): Promise<MeiSettings | null> {
  try {
    const supabase = createClient()
    let { data, error } = await supabase.from("mei_settings").select("*").eq("id", FIXED_MEI_SETTINGS_ID).single()

    if (error && error.code === "PGRST116") {
      console.warn("MEI settings not found, attempting to create default.")
      const { data: newData, error: newError } = await supabase
        .from("mei_settings")
        .insert({ id: FIXED_MEI_SETTINGS_ID, das_paid_this_month: false, updated_at: new Date().toISOString() })
        .select()
        .single()
      if (newError) {
        console.error("Error creating default MEI settings in Supabase:", newError)
        return null
      }
      data = newData
    } else if (error) {
      console.error("Error fetching MEI settings from Supabase:", error)
      return null
    }

    if (!data) {
      console.warn("MEI settings data is null after fetch/create attempt.")
      return null
    }

    if (data.updated_at) {
      const settingsDate = new Date(data.updated_at)
      const currentDate = new Date()
      const isCurrentMonthAndYear =
        settingsDate.getFullYear() === currentDate.getFullYear() && settingsDate.getMonth() === currentDate.getMonth()
      data.das_paid_this_month = isCurrentMonthAndYear ? data.das_paid_this_month : false
    } else {
      data.das_paid_this_month = false
    }

    return data as MeiSettings
  } catch (e) {
    console.error("Unexpected error in getMeiSettings action:", e)
    return null
  }
}

export async function updateDasStatus(dasPaid: boolean): Promise<MeiSettings | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("mei_settings")
      .update({ das_paid_this_month: dasPaid, updated_at: new Date().toISOString() })
      .eq("id", FIXED_MEI_SETTINGS_ID)
      .select()
      .single()

    if (error) {
      console.error("Error updating DAS status in Supabase:", error)
      return null
    }
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/settings/company-profile")
    return data as MeiSettings
  } catch (e) {
    console.error("Unexpected error in updateDasStatus action:", e)
    return null
  }
}

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("id", FIXED_COMPANY_PROFILE_ID_FOR_SIMULATION)
      .maybeSingle()

    if (error) {
      console.error("Error fetching company profile from Supabase:", error)
      return null
    }
    return data
  } catch (e) {
    console.error("Unexpected error in getCompanyProfile action:", e)
    return null
  }
}

export async function updateCompanyProfile(
  profileData: Partial<CompanyProfile>,
): Promise<{ profile: CompanyProfile | null; error?: string }> {
  try {
    const supabase = createClient()
    const currentTimestamp = new Date().toISOString()
    const dataToUpsert = { ...profileData, updated_at: currentTimestamp }
    const idToUse = profileData.id || FIXED_COMPANY_PROFILE_ID_FOR_SIMULATION

    const { data, error } = await supabase
      .from("company_profiles")
      .upsert({ ...dataToUpsert, id: idToUse }, { onConflict: "id" })
      .select()
      .single()

    if (error) {
      console.error("Error upserting company profile in Supabase:", error)
      return { profile: null, error: "Falha ao salvar perfil da empresa." }
    }

    revalidatePath("/dashboard/settings/company-profile")
    return { profile: data }
  } catch (e) {
    console.error("Unexpected error in updateCompanyProfile action:", e)
    return { profile: null, error: "Ocorreu um erro inesperado ao salvar o perfil." }
  }
}

// --- Saved Reports Actions ---

export async function getSavedReports(): Promise<SavedReportConfig[]> {
  try {
    const supabase = createClient()
    // In a real app, you'd filter by user_id: .eq('user_id', FIXED_USER_ID_FOR_SIMULATION)
    const { data, error } = await supabase.from("saved_reports").select("*").order("report_name", { ascending: true })

    if (error) {
      console.error("Error fetching saved reports:", error)
      return []
    }
    return data as SavedReportConfig[]
  } catch (e) {
    console.error("Unexpected error in getSavedReports:", e)
    return []
  }
}

export async function upsertReportConfiguration(
  reportConfig: Partial<SavedReportConfig>,
): Promise<{ report: SavedReportConfig | null; error?: string; isUpdate: boolean }> {
  try {
    const supabase = createClient()
    const { id, report_name, filters, selected_fields, visualization_type, visualization_config } = reportConfig
    let isUpdate = false

    const dataToUpsert: Omit<SavedReportConfig, "id" | "created_at" | "user_id"> & { updated_at: string } = {
      report_name: report_name!,
      filters: filters!,
      selected_fields: selected_fields!,
      visualization_type: visualization_type!,
      visualization_config: visualization_config,
      updated_at: new Date().toISOString(),
    }

    let query
    if (id) {
      isUpdate = true
      query = supabase.from("saved_reports").update(dataToUpsert).eq("id", id).select().single()
    } else {
      query = supabase.from("saved_reports").insert(dataToUpsert).select().single()
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error ${isUpdate ? "updating" : "saving"} report configuration:`, error)
      return {
        report: null,
        error: `Falha ao ${isUpdate ? "atualizar" : "salvar"} configuração do relatório.`,
        isUpdate,
      }
    }
    revalidatePath("/dashboard/reports")
    return { report: data as SavedReportConfig, isUpdate }
  } catch (e) {
    console.error("Unexpected error in upsertReportConfiguration:", e)
    return { report: null, error: "Ocorreu um erro inesperado ao processar o relatório.", isUpdate: !!reportConfig.id }
  }
}

export async function deleteSavedReport(reportId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("saved_reports").delete().match({ id: reportId })

    if (error) {
      console.error("Error deleting saved report:", error)
      return { success: false, error: "Falha ao excluir relatório salvo." }
    }
    revalidatePath("/dashboard/reports")
    return { success: true }
  } catch (e) {
    console.error("Unexpected error in deleteSavedReport:", e)
    return { success: false, error: "Ocorreu um erro inesperado ao excluir o relatório." }
  }
}
