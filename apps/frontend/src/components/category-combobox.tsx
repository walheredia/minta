"use client"

import { useEffect, useState } from "react"
import { CircleAlert } from "lucide-react"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/lib/api-client"
import { CATEGORY_SEARCH_MIN_LENGTH, normalizeCategoryKey, splitOnMatch } from "@/lib/category-name"
import type { ExpenseCategory } from "@/lib/expenses"

const SEARCH_DEBOUNCE_MS = 250

type SearchStatus = "idle" | "loading" | "error" | "ready"

interface SearchResult {
  /** Which request (retry attempt + query) this result answers. */
  key: string
  status: "ready" | "error"
  items: ExpenseCategory[]
}

interface CategoryComboboxProps {
  id: string
  value: ExpenseCategory | null
  onChange: (value: ExpenseCategory | null) => void
  invalid?: boolean
  inputRef?: React.Ref<HTMLInputElement>
}

function sameCategory(a: ExpenseCategory, b: ExpenseCategory) {
  return a.id === b.id && a.source === b.source
}

function HighlightedName({ name, query }: { name: string; query: string }) {
  const [before, match, after] = splitOnMatch(name, query)
  return (
    <span className="truncate">
      {before}
      {match && <span className="font-semibold">{match}</span>}
      {after}
    </span>
  )
}

/**
 * Search-as-you-type picker for an Expense Category ("Tipo de gasto").
 * Searches the server after {@link CATEGORY_SEARCH_MIN_LENGTH} characters,
 * debounced, ignoring stale responses. See DESIGN.md "Search-as-you-type".
 */
export function CategoryCombobox({ id, value, onChange, invalid = false, inputRef }: CategoryComboboxProps) {
  const [inputValue, setInputValue] = useState(value?.name ?? "")
  const [open, setOpen] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const [result, setResult] = useState<SearchResult | null>(null)
  // The value this component last saw or emitted; a different incoming value
  // means the parent reset or replaced it, so the visible text follows.
  const [syncedValue, setSyncedValue] = useState(value)

  if (value !== syncedValue) {
    setSyncedValue(value)
    setInputValue(value?.name ?? "")
  }

  const query = inputValue.trim()
  const searchable = normalizeCategoryKey(query).length >= CATEGORY_SEARCH_MIN_LENGTH
  const showingSelection = value !== null && inputValue === value.name
  const shouldSearch = searchable && !showingSelection
  const requestKey = `${retryToken}:${query}`

  const status: SearchStatus = !shouldSearch
    ? "idle"
    : result?.key === requestKey
      ? result.status
      : "loading"

  function emit(next: ExpenseCategory | null) {
    setSyncedValue(next)
    onChange(next)
  }

  useEffect(() => {
    if (!shouldSearch) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const response = await apiFetch(`/api/expense-categories?q=${encodeURIComponent(query)}`)
        const items = response.ok ? ((await response.json()) as ExpenseCategory[]) : []
        if (!cancelled) setResult({ key: requestKey, status: response.ok ? "ready" : "error", items })
      } catch {
        if (!cancelled) setResult({ key: requestKey, status: "error", items: [] })
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [shouldSearch, query, requestKey])

  const results = status === "ready" && result ? result.items : []
  const items = results
  const helperId = `${id}-helper`

  return (
    <div className="flex flex-col gap-1.5">
      <Combobox<ExpenseCategory>
        items={items}
        filter={null}
        value={value}
        onValueChange={(next) => emit(next)}
        inputValue={inputValue}
        onInputValueChange={(next, details) => {
          setInputValue(next)
          if (details.reason === "input-change") setOpen(true)
          if (value && next !== value.name) emit(null)
        }}
        open={open && searchable && !showingSelection}
        onOpenChange={setOpen}
        itemToStringLabel={(category) => category.name}
        isItemEqualToValue={sameCategory}
      >
        <ComboboxInput
          id={id}
          ref={inputRef}
          placeholder="Ej.: Panadería"
          autoComplete="off"
          showTrigger={false}
          showClear={value !== null}
          aria-invalid={invalid || undefined}
          aria-describedby={helperId}
          className="h-10 shadow-xs dark:shadow-none"
        />
        <ComboboxContent className="min-w-(--anchor-width)">
          {status === "loading" && (
            <div role="status" aria-label="Buscando tipos de gasto" className="flex flex-col gap-1 p-1">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex h-10 items-center px-1.5 pointer-fine:h-8">
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-destructive">
              <span className="flex items-center gap-2">
                <CircleAlert aria-hidden className="size-4 shrink-0" />
                No pudimos cargar los tipos de gasto.
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRetryToken((n) => n + 1)}>
                Reintentar
              </Button>
            </div>
          )}

          {status === "ready" && results.length === 0 && (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">No encontramos «{query}»</p>
          )}

          <ComboboxList>
            {(category: ExpenseCategory) => (
              <ComboboxItem
                key={`${category.source}:${category.id}`}
                value={category}
                className="min-h-10 py-2 pointer-fine:min-h-8 pointer-fine:py-1.5"
              >
                <HighlightedName name={category.name} query={query} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {!showingSelection && !searchable && (
        <p id={helperId} className="text-xs text-muted-foreground">
          Escribí al menos 3 letras
        </p>
      )}
    </div>
  )
}
