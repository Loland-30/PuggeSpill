import { LayoutGrid, Rows3 } from "lucide-react"

import { useI18n } from "../../i18n/I18nContext"
import type { PaletteTheme } from "../../theme/themes"

export type DeckViewMode = "list" | "grid"

interface DeckViewToggleProps {
    value: DeckViewMode
    onChange: (viewMode: DeckViewMode) => void
    palette: PaletteTheme
}

export default function DeckViewToggle({ value, onChange, palette }: DeckViewToggleProps) {
    const { t } = useI18n()

    return (
        <div className={`relative flex h-[50px] items-center rounded-full border bg-black/20 p-1 backdrop-blur-md ${palette.border}`}>
            <div
                className={`absolute left-1 top-1 h-10 w-10 rounded-full shadow-lg transition-transform duration-300 ease-out ${palette.primaryButton} ${palette.glow} ${value === "grid" ? "translate-x-10" : "translate-x-0"}`}
                aria-hidden="true"
            />

            <button
                type="button"
                onClick={() => onChange("list")}
                className={`relative z-10 grid h-10 w-10 place-items-center rounded-full transition ${value === "list" ? palette.primaryButtonText : "text-white/45 hover:text-white"}`}
                aria-label={t.deckPage.view.list}
                aria-pressed={value === "list"}
                title={t.deckPage.view.list}
            >
                <Rows3 size={20} strokeWidth={2.6} />
            </button>

            <button
                type="button"
                onClick={() => onChange("grid")}
                className={`relative z-10 grid h-10 w-10 place-items-center rounded-full transition ${value === "grid" ? palette.primaryButtonText : "text-white/45 hover:text-white"}`}
                aria-label={t.deckPage.view.grid}
                aria-pressed={value === "grid"}
                title={t.deckPage.view.grid}
            >
                <LayoutGrid size={20} strokeWidth={2.6} />
            </button>
        </div>
    )
}