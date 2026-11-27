"use client"

import { useEffect, useState } from "react"
import { CircleAlert, Plus } from "lucide-react"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  CATEGORY_NAME_MAX_LENGTH,
  CATEGORY_SEARCH_MIN_LENGTH,
  normalizeCategoryKey,
  splitOnMatch,
  toCategoryDisplayName,
} from "@/lib/category-name"
import type { CategoryChoice, ExpenseCategory } from "@/lib/expenses"

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
  value: CategoryChoice | null
  onChange: (value: CategoryChoice | null) => void
  invalid?: boolean
  inputRef?: React.Ref<HTMLInputElement>
}

function choiceKey(choice: CategoryChoice): string {
  return choice.source === "NEW" ? `NEW:${normalizeCategoryKey(choice.name)}` : `${choice.source}:${choice.id}`
}

function sameChoice(a: CategoryChoice, b: CategoryChoice) {
  return choiceKey(a) === choiceKey(b)
}

function HighlightedName({ name, query }: { name: string; query: string }) {
  const [before, match, after] = splitOnMatch(name, query)
  return (
    <span className="min-w-0 flex-1 truncate">
      {before}
      {match && <span className="font-semibold">{match}</span>}
      {after}
    </span>
  )
}

/**
 * Search-as-you-type picker for an Expense Category ("Tipo de gasto").
 * Searches the server after {@link CATEGORY_SEARCH_MIN_LENGTH} characters,
 * debounced, ignoring stale responses, and offers "Crear «X»" when no
 * equivalent category exists. See DESIGN.md "Search-as-you-type".
 */
export function CategoryCombobox({ id, value, onChange, invalid = false, inputRef }: CategoryComboboxProps) {
  const [inputValue, setInputValue] = useState(value?.name ?? "")
  const [open, setOpen] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const [result, setResult] = useState<SearchResult | null>(null)
  // The value this component last saw or emitted; a different incoming value
  // means the parent reset or replaced it, so the visible text follows.
  const [syncedValue, setSyncedValue] = useState(value)
  const anchorRef = useComboboxAnchor()

  if (value !== syncedValue) {
    setSyncedValue(value)
    setInputValue(value?.name ?? "")
  }

  const query = inputValue.trim()
  const queryKey = normalizeCategoryKey(query)
  const searchable = queryKey.length >= CATEGORY_SEARCH_MIN_LENGTH
  const showingSelection = value !== null && inputValue === value.name
  const shouldSearch = searchable && !showingSelection
  const requestKey = `${retryToken}:${query}`

  const status: SearchStatus = !shouldSearch
    ? "idle"
    : result?.key === requestKey
      ? result.status
      : "loading"

  function emit(next: CategoryChoice | null) {
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
  const settled = status === "ready" || status === "error"
  const newName = toCategoryDisplayName(query)
  const tooLong = newName.length > CATEGORY_NAME_MAX_LENGTH
  const hasEquivalent = results.some((category) => normalizeCategoryKey(category.name) === queryKey)
  const createOption: CategoryChoice | null =
    settled && !tooLong && !hasEquivalent ? { source: "NEW", name: newName } : null
  const items: CategoryChoice[] = createOption ? [...results, createOption] : results
  const helperId = `${id}-helper`
  const showHelper = !showingSelection && !searchable
  // While typing, the helper's line stays reserved so the fields below don't
  // jump at the third letter; once a category is chosen it collapses.
  const helperSpace = showHelper ? "visible" : showingSelection ? "collapsed" : "reserved"

  return (
    <div className="flex flex-col gap-1.5">
      <Combobox<CategoryChoice>
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
        open={open && shouldSearch}
        onOpenChange={setOpen}
        itemToStringLabel={(choice) => choice.name}
        isItemEqualToValue={sameChoice}
      >
        <div ref={anchorRef}>
          <ComboboxInput
            id={id}
            ref={inputRef}
            placeholder="Ej.: Panadería"
            autoComplete="off"
            showTrigger={false}
            showClear={value !== null}
            clearLabel="Borrar tipo de gasto"
            aria-invalid={invalid || undefined}
            aria-describedby={showHelper ? helperId : undefined}
            className="h-10 shadow-xs dark:shadow-none"
          />
        </div>
        {/* Anchored to the whole field (not the inner <input>) so the popover matches its width. */}
        <ComboboxContent anchor={anchorRef}>
          {status === "loading" && (
            <div role="status" aria-label="Buscando tipos de gasto" className="flex flex-col gap-1 p-1">
              {["w-3/5", "w-2/3", "w-2/5"].map((width) => (
                <div key={width} className="flex h-10 items-center px-1.5 pointer-fine:h-8">
                  <Skeleton className={cn("h-3.5 dark:bg-foreground/10", width)} />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-destructive">
              <span className="flex items-center gap-2">
                <CircleAlert aria-hidden className="size-4 shrink-0" />
                No pudimos cargar los tipos de gasto.
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-foreground"
                onClick={() => setRetryToken((n) => n + 1)}
              >
                Reintentar
              </Button>
            </div>
          )}

          {status === "ready" && results.length === 0 && !tooLong && (
            <p className="px-3 pt-2.5 pb-1 text-sm wrap-anywhere text-muted-foreground">
              No encontramos «{query}»
            </p>
          )}

          {settled && tooLong && (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">
              Máximo {CATEGORY_NAME_MAX_LENGTH} caracteres.
            </p>
          )}

          <ComboboxList>
            {(choice: CategoryChoice) =>
              choice.source === "NEW" ? (
                <ComboboxItem
                  key={choiceKey(choice)}
                  value={choice}
                  className="min-h-10 py-2 pointer-fine:min-h-8 pointer-fine:py-1.5 not-first:mt-1.5 not-first:before:absolute not-first:before:inset-x-0 not-first:before:-top-1 not-first:before:h-px not-first:before:bg-border"
                >
                  <Plus aria-hidden className="text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">Crear «{choice.name}»</span>
                </ComboboxItem>
              ) : (
                <ComboboxItem
                  key={choiceKey(choice)}
                  value={choice}
                  className="min-h-10 py-2 pointer-fine:min-h-8 pointer-fine:py-1.5"
                >
                  {/* Household Categories carry no source label until Households can have
                      more than one member: today it would tell the user nothing. */}
                  <HighlightedName name={choice.name} query={query} />
                </ComboboxItem>
              )
            }
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {/* The line is always reserved so fields below don't jump when it hides. */}
      <p
        id={helperId}
        aria-hidden={!showHelper}
        className={cn(
          "text-xs text-muted-foreground",
          helperSpace === "reserved" && "invisible",
          helperSpace === "collapsed" && "hidden"
        )}
      >
        Escribí al menos {CATEGORY_SEARCH_MIN_LENGTH} letras
      </p>
    </div>
  )
}
