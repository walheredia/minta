"use client"

import { useRef, useState } from "react"
import { CategoryCombobox } from "@/components/category-combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DETAIL_MAX_LENGTH, toCategoryRef, toDetail } from "@/lib/expenses"
import type { CategoryChoice, ExpenseInput } from "@/lib/expenses"
import { cn } from "@/lib/utils"

interface Classification {
  category: CategoryChoice | null
  detail: string
}

/**
 * State for how an Expense is classified: its Expense Category and optional
 * Detail. Shared by the add form and the inline edit.
 */
export function useExpenseClassification(initial: Classification = { category: null, detail: "" }) {
  const [category, setCategory] = useState<CategoryChoice | null>(initial.category)
  const [detail, setDetail] = useState(initial.detail)
  const categoryInputRef = useRef<HTMLInputElement>(null)

  /**
   * The classification fields to send, or null when no category was chosen
   * (focus then moves to the category picker so the user can fix it).
   */
  function toPayload(): Pick<ExpenseInput, "category" | "detail"> | null {
    if (!category) {
      categoryInputRef.current?.focus()
      return null
    }
    return { category: toCategoryRef(category), detail: toDetail(detail) }
  }

  function reset() {
    setCategory(null)
    setDetail("")
  }

  return { category, setCategory, detail, setDetail, categoryInputRef, toPayload, reset }
}

export type ExpenseClassification = ReturnType<typeof useExpenseClassification>

interface ExpenseClassificationFieldsProps {
  /** Prefix for the field ids, unique per form on the page. */
  idPrefix: string
  classification: ExpenseClassification
  /** True while the form is reporting a missing category. */
  categoryInvalid: boolean
  /** Called when the user picks or creates a category, e.g. to clear a validation error. */
  onCategoryChosen?: () => void
  detailClassName?: string
}

/** The "Tipo de gasto" and "Detalle" fields, as two siblings for the parent's layout. */
export function ExpenseClassificationFields({
  idPrefix,
  classification,
  categoryInvalid,
  onCategoryChosen,
  detailClassName,
}: ExpenseClassificationFieldsProps) {
  const { category, setCategory, detail, setDetail, categoryInputRef } = classification

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-category`}>Tipo de gasto</Label>
        <CategoryCombobox
          id={`${idPrefix}-category`}
          value={category}
          onChange={(next) => {
            setCategory(next)
            if (next) onCategoryChosen?.()
          }}
          invalid={categoryInvalid}
          inputRef={categoryInputRef}
        />
      </div>

      <div className={cn("flex flex-col gap-1.5", detailClassName)}>
        <Label htmlFor={`${idPrefix}-detail`}>
          Detalle <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id={`${idPrefix}-detail`}
          name="detail"
          type="text"
          maxLength={DETAIL_MAX_LENGTH}
          placeholder="Ej.: facturas para el domingo"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
        />
      </div>
    </>
  )
}
