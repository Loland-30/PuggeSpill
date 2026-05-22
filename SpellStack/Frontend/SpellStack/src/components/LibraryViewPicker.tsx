import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Trophy, type LucideIcon } from "lucide-react"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"

export type LibraryView = "decks" | "trials"

interface LibraryViewPickerProps {
    activeView: LibraryView
    onChange: (view: LibraryView) => void
}

const views: Array<{ id: LibraryView; icon: LucideIcon }> = [
    { id: "decks", icon: BookOpen },
    { id: "trials", icon: Trophy }
]

export default function LibraryViewPicker({ activeView, onChange }: LibraryViewPickerProps) {
    const { t } = useI18n()
    const { palette } = useTheme()
    const [visualActiveView, setVisualActiveView] = useState(activeView)

    useEffect(() => {
        setVisualActiveView(activeView)
    }, [activeView])

    const getLabel = (view: LibraryView) => view === "decks" ? t.common.decks : t.common.trials

    const handleChange = (view: LibraryView) => {
        setVisualActiveView(view)
        onChange(view)
    }

    return (
        <div className="relative inline-flex h-11 items-center overflow-hidden rounded-full border border-white/15 bg-black/20 p-1 backdrop-blur">
            {views.map(({ id, icon: Icon }) => {
                const active = visualActiveView === id
                const label = getLabel(id)

                return (
                    <div key={id} className="group relative">
                        <button
                            type="button"
                            onClick={() => handleChange(id)}
                            className={`relative flex h-9 min-w-[5.5rem] items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-sm font-black transition-colors duration-200 ${
                                active
                                    ? palette.primaryButtonText
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            {active && (
                                <motion.span
                                    layoutId="library-mode-active-pill"
                                    className={`absolute inset-0 rounded-full shadow-lg ${palette.primaryButton} ${palette.glow}`}
                                    transition={{
                                        type: "spring",
                                        stiffness: 420,
                                        damping: 34,
                                        mass: 0.8
                                    }}
                                    aria-hidden="true"
                                />
                            )}

                            <span className="relative z-10 flex items-center gap-2">
                                <Icon size={17} strokeWidth={2.8} />
                                {label}
                            </span>
                        </button>

                        <div className="pointer-events-none absolute left-1/2 top-[calc(100%+0.6rem)] z-50 -translate-x-1/2 rounded-lg bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl transition delay-700 group-hover:opacity-100">
                            {label}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
