import type { ReactNode } from "react"
import { BookOpen, Trophy } from "lucide-react"
import { useTheme } from "../theme/ThemeContext"

export type LibraryView = "decks" | "trials"

interface LibraryViewPickerProps {
    activeView: LibraryView
    onChange: (view: LibraryView) => void
}

export default function LibraryViewPicker({ activeView, onChange }: LibraryViewPickerProps) {
    return (
        <div className="flex rounded-full border border-white/15 bg-black/20 p-1 backdrop-blur">
            <LibraryToggleButton
                active={activeView === "decks"}
                icon={<BookOpen size={17} strokeWidth={2.8} />}
                label="Decks"
                tooltip="Your decks"
                onClick={() => onChange("decks")}
            />
            <LibraryToggleButton
                active={activeView === "trials"}
                icon={<Trophy size={17} strokeWidth={2.8} />}
                label="Trials"
                tooltip="Trials"
                onClick={() => onChange("trials")}
            />
        </div>
    )
}

function LibraryToggleButton({ active, icon, label, tooltip, onClick }: {
    active: boolean
    icon: ReactNode
    label: string
    tooltip: string
    onClick: () => void
}) {
    const { palette } = useTheme()

    return (
        <div className="group relative">
            <button
                type="button"
                onClick={onClick}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${
                    active
                        ? `${palette.primaryButton} text-white shadow-lg`
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
            >
                {icon}
                {label}
            </button>

            <div className="pointer-events-none absolute left-1/2 top-[calc(100%+0.6rem)] z-50 -translate-x-1/2 rounded-lg bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl transition delay-700 group-hover:opacity-100">
                {tooltip}
            </div>
        </div>
    )
}
