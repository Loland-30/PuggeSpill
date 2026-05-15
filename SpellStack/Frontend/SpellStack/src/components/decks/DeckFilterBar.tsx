import { useEffect, useRef, useState } from "react"
import { ChevronDown, RotateCcw } from "lucide-react"

import { languages } from "../../data/languages"
import type { PaletteTheme } from "../../theme/themes"

export type DeckLengthFilter = "any" | "short" | "medium" | "long"
export type DeckSortOption = "newest" | "name-asc" | "most-words" | "fewest-words"

interface DeckFilterBarProps {
    selectedLanguage: string
    onLanguageChange: (language: string) => void
    selectedLength: DeckLengthFilter
    onLengthChange: (length: DeckLengthFilter) => void
    selectedSort: DeckSortOption
    onSortChange: (sort: DeckSortOption) => void
    onReset: () => void
    canReset: boolean
    palette: PaletteTheme
}

interface FilterOption<T extends string> {
    value: T
    label: string
    flagUrl?: string
}

const lengthOptions: FilterOption<DeckLengthFilter>[] = [
    { value: "any", label: "Any length" },
    { value: "short", label: "Short: 1-20" },
    { value: "medium", label: "Medium: 21-50" },
    { value: "long", label: "Long: 51+" }
]

const sortOptions: FilterOption<DeckSortOption>[] = [
    { value: "newest", label: "Newest" },
    { value: "name-asc", label: "Name A-Z" },
    { value: "most-words", label: "Most words" },
    { value: "fewest-words", label: "Fewest words" }
]

export default function DeckFilterBar({
    selectedLanguage,
    onLanguageChange,
    selectedLength,
    onLengthChange,
    selectedSort,
    onSortChange,
    onReset,
    canReset,
    palette
}: DeckFilterBarProps) {
    const languageOptions: FilterOption<string>[] = [
        { value: "all", label: "All Languages" },
        ...languages.map(language => ({
            value: language.code,
            label: language.label,
            flagUrl: language.flagUrl
        }))
    ]

    return (
        <div className={`relative z-[1000] mx-auto mb-8 flex w-full max-w-3xl flex-wrap items-center justify-center rounded-full border text-white shadow-lg backdrop-blur-md ${palette.border} ${palette.card} ${palette.glow}`}>
            <FilterDropdown
                value={selectedLanguage}
                options={languageOptions}
                onChange={onLanguageChange}
                palette={palette}
                className="min-w-56 rounded-l-full"
            />

            <FilterDivider />

            <FilterDropdown
                value={selectedLength}
                options={lengthOptions}
                onChange={onLengthChange}
                palette={palette}
                className="min-w-48"
            />

            <FilterDivider />

            <FilterDropdown
                value={selectedSort}
                options={sortOptions}
                onChange={onSortChange}
                palette={palette}
                className="min-w-44"
            />

            <FilterDivider />

            <button
                type="button"
                onClick={onReset}
                disabled={!canReset}
                className="flex h-16 min-w-36 items-center justify-center gap-2 rounded-r-full px-6 text-lg font-bold text-white transition disabled:cursor-not-allowed disabled:text-white/35"
            >
                <RotateCcw size={20} strokeWidth={2.6} />
                Reset
            </button>
        </div>
    )
}

function FilterDropdown<T extends string>({
    value,
    options,
    onChange,
    palette,
    className
}: {
    value: T
    options: FilterOption<T>[]
    onChange: (value: T) => void
    palette: PaletteTheme
    className?: string
}) {
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const selected = options.find(option => option.value === value) ?? options[0]

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener("pointerdown", handlePointerDown)
        return () => document.removeEventListener("pointerdown", handlePointerDown)
    }, [])

    return (
        <div ref={menuRef} className={`relative ${className ?? ""}`}>
            <button
                type="button"
                onClick={() => setOpen(current => !current)}
                className="flex h-16 w-full items-center gap-3 px-6 text-left text-lg font-bold text-white transition"
                aria-expanded={open}
            >
                {selected.flagUrl && (
                    <img
                        src={selected.flagUrl}
                        alt=""
                        className="h-7 w-10 shrink-0 rounded-md object-cover"
                    />
                )}
                <span className="min-w-0 flex-1 truncate">
                    {selected.label}
                </span>
                <ChevronDown size={22} strokeWidth={3} className={`shrink-0 text-white transition ${open ? "rotate-180" : ""}`} />
            </button>

            <div
                aria-hidden={!open}
                className={`absolute left-0 top-full z-[1001] mt-2 w-64 origin-top overflow-hidden rounded-xl border bg-slate-950/95 p-1 shadow-2xl backdrop-blur-xl transition-all duration-200 ease-out ${palette.border} ${open ? "translate-y-0 scale-y-100 opacity-100" : "pointer-events-none -translate-y-3 scale-y-95 opacity-0"}`}
            >
                {options.map(option => {
                    const isSelected = option.value === value

                    return (
                        <button
                            key={option.value}
                            type="button"
                            tabIndex={open ? 0 : -1}
                            onClick={() => {
                                onChange(option.value)
                                setOpen(false)
                            }}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-semibold transition ${isSelected ? `${palette.primaryButton} ${palette.primaryButtonText}` : "text-white hover:bg-white/[0.06]"}`}
                        >
                            {option.flagUrl ? (
                                <img src={option.flagUrl} alt="" className="h-5 w-7 rounded-sm object-cover" />
                            ) : (
                                <span className="h-5 w-7 shrink-0" />
                            )}
                            <span>{option.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function FilterDivider() {
    return <div className="hidden h-10 w-px bg-white/45 sm:block" />
}