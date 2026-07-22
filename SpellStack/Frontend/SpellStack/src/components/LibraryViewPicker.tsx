import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, UsersRound, type LucideIcon } from "lucide-react"
import { useUISound } from "../audio/useUISound"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"

export type LibraryView = "decks" | "multiplayer"

interface LibraryViewPickerProps {
    activeView: LibraryView
    onChange: (view: LibraryView) => void
}

const views: Array<{ id: LibraryView; icon: LucideIcon }> = [
    { id: "decks", icon: BookOpen },
    { id: "multiplayer", icon: UsersRound }
]

export default function LibraryViewPicker({ activeView, onChange }: LibraryViewPickerProps) {
    const { t } = useI18n()
    const { palette } = useTheme()
    const { playHoverSound } = useUISound()
    const [visualActiveView, setVisualActiveView] = useState(activeView)

    useEffect(() => {
        setVisualActiveView(activeView)
    }, [activeView])

    const getLabel = (view: LibraryView) => {
        if (view === "decks") return t.common.decks
        if (view === "multiplayer") return t.nav.multiplayer
        return t.nav.multiplayer
    }

    const handleChange = (view: LibraryView) => {
        setVisualActiveView(view)
        onChange(view)
    }

    return (
        <div className="relative inline-flex h-11 w-full items-center overflow-hidden rounded-full border border-white/15 bg-black/20 p-1 backdrop-blur sm:w-auto">
            {views.map(({ id, icon: Icon }) => {
                const active = visualActiveView === id
                const label = getLabel(id)

                return (
                    <div key={id} className="group relative min-w-0 flex-1 sm:flex-none">
                        <button
                            type="button"
                            onClick={() => handleChange(id)}
                            onMouseEnter={playHoverSound}
                            className={`relative flex h-9 w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-full px-2 text-xs font-black transition-colors duration-200 sm:min-w-[5.5rem] sm:gap-2 sm:px-4 sm:text-sm ${
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

                            <span className="relative z-10 flex min-w-0 items-center gap-1.5 sm:gap-2">
                                <Icon size={16} strokeWidth={2.8} className="shrink-0" />
                                <span className="truncate">{label}</span>
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
