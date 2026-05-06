import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

import { languages } from "../data/languages"
import { useTheme } from "../theme/ThemeContext"

interface Props {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    inputClassName?: string
    panelClassName?: string
}

export default function LanguageSelect({ value, onChange, placeholder = "Select language", inputClassName = "text-white", panelClassName = "bg-black/30" }: Props) {
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const { theme, palette } = useTheme()
    const selected = languages.find(language => language.code === value)
    const isRedPurple = theme.paletteId === "purpleGradient"

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
        <div ref={menuRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(current => !current)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left backdrop-blur transition hover:border-white/40 ${isRedPurple ? "border-fuchsia-400/80 bg-slate-950/45 shadow-[0_0_14px_rgba(217,70,239,0.14)]" : `border-white/20 shadow-lg ${panelClassName}`}`}
            >
                {selected ? (
                    <img src={selected.flagUrl} className="h-5 w-7 rounded-sm object-cover" />
                ) : (
                    <span className="h-5 w-7 rounded-sm border border-white/20 bg-black/30" />
                )}
                <span className={`min-w-0 flex-1 text-base font-semibold ${inputClassName}`}>
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown size={18} className={`shrink-0 text-white transition ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className={`absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border ${isRedPurple ? "border-fuchsia-400/80" : palette.border} bg-slate-950/95 p-1 shadow-2xl backdrop-blur-xl`}>
                    {languages.map(language => {
                        const isSelected = language.code === value

                        return (
                            <button
                                key={language.code}
                                type="button"
                                onClick={() => {
                                    onChange(language.code)
                                    setOpen(false)
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-semibold transition ${isSelected ? `${palette.primaryButton} text-white` : "text-white hover:bg-white/10"}`}
                            >
                                <img src={language.flagUrl} className="h-5 w-7 rounded-sm object-cover" />
                                <span>{language.label}</span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}



