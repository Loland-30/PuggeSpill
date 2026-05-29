import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Search } from "lucide-react"

import { useI18n } from "../../i18n/I18nContext"
import type { PaletteTheme } from "../../theme/themes"

export interface SettingsSelectOption {
    value: string
    label: string
    flagUrl?: string
}

interface SettingsSelectProps {
    value: string
    onChange: (value: string) => void
    options: SettingsSelectOption[]
    palette: PaletteTheme
    disabled?: boolean
    label: string
    searchable?: boolean
}

interface MenuPosition {
    left: number
    top: number
    width: number
    maxHeight: number
}

export default function SettingsSelect({ value, onChange, options, palette, disabled = false, label, searchable = false }: SettingsSelectProps) {
    const { t } = useI18n()
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const selected = options.find(option => option.value === value) ?? options[0]
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const filteredOptions = searchable && normalizedSearch
        ? options.filter(option =>
            option.label.toLowerCase().includes(normalizedSearch) ||
            option.value.toLowerCase().includes(normalizedSearch)
        )
        : options

    const updateMenuPosition = () => {
        const rect = rootRef.current?.getBoundingClientRect()
        if (!rect) return

        setMenuPosition({
            left: rect.left,
            top: rect.bottom + 8,
            width: rect.width,
            maxHeight: Math.max(180, window.innerHeight - rect.bottom - 24)
        })
    }

    const openMenu = () => {
        if (disabled) return
        setSearchTerm("")
        updateMenuPosition()
        setOpen(true)
    }

    const closeMenu = () => {
        setOpen(false)
        setSearchTerm("")
    }

    useEffect(() => {
        if (!open) return

        updateMenuPosition()
        if (searchable) {
            window.setTimeout(() => searchInputRef.current?.focus(), 0)
        }

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node
            const clickedTrigger = rootRef.current?.contains(target)
            const clickedMenu = menuRef.current?.contains(target)

            if (!clickedTrigger && !clickedMenu) {
                closeMenu()
            }
        }

        const handleReposition = () => updateMenuPosition()

        document.addEventListener("pointerdown", handlePointerDown)
        window.addEventListener("resize", handleReposition)
        window.addEventListener("scroll", handleReposition, true)

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            window.removeEventListener("resize", handleReposition)
            window.removeEventListener("scroll", handleReposition, true)
        }
    }, [open])

    return (
        <div ref={rootRef} className="relative w-full min-w-64">
            {open && searchable ? (
                <div className={`flex w-full items-center gap-3 rounded-2xl border ${palette.border} bg-slate-950/90 px-4 py-3 text-left text-sm font-bold text-white shadow-xl outline-none backdrop-blur transition focus-within:ring-2 focus-within:ring-white/20`}>
                    {searchTerm ? (
                        <Search size={18} strokeWidth={2.6} className="shrink-0 text-white/50" />
                    ) : selected?.flagUrl ? (
                        <img
                            src={selected.flagUrl}
                            alt=""
                            className="h-5 w-7 shrink-0 rounded-sm object-cover shadow-lg"
                        />
                    ) : (
                        <Search size={18} strokeWidth={2.6} className="shrink-0 text-white/50" />
                    )}
                    <input
                        ref={searchInputRef}
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        onKeyDown={event => {
                            if (event.key === "Escape") closeMenu()
                        }}
                        placeholder={selected?.label ?? label}
                        aria-label={label}
                        className="min-w-0 flex-1 bg-transparent text-white placeholder:text-white outline-none"
                    />
                    <button
                        type="button"
                        onClick={closeMenu}
                        className="grid h-5 w-5 shrink-0 place-items-center text-white"
                        aria-label={t.common.close}
                    >
                        <ChevronDown size={18} strokeWidth={3} className="rotate-180 transition" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={open ? closeMenu : openMenu}
                    disabled={disabled}
                    aria-label={label}
                    aria-expanded={open}
                    className={`flex w-full items-center gap-3 rounded-2xl border ${palette.border} bg-slate-950/90 px-4 py-3 text-left text-sm font-bold text-white shadow-xl outline-none backdrop-blur transition focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    {selected?.flagUrl && (
                        <img
                            src={selected.flagUrl}
                            alt=""
                            className="h-5 w-7 shrink-0 rounded-sm object-cover shadow-lg"
                        />
                    )}
                    <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
                    <ChevronDown size={18} strokeWidth={3} className={`shrink-0 transition ${open ? "rotate-180" : ""}`} />
                </button>
            )}

            {open && menuPosition && createPortal(
                <div
                    ref={menuRef}
                    className={`fixed z-[5000] origin-top overflow-y-auto rounded-2xl border bg-slate-950/95 p-1 shadow-2xl backdrop-blur-xl transition-all duration-200 ease-out ${palette.border}`}
                    style={{
                        left: menuPosition.left,
                        top: menuPosition.top,
                        width: menuPosition.width,
                        maxHeight: menuPosition.maxHeight
                    }}
                >
                    {filteredOptions.length > 0 ? filteredOptions.map(option => {
                        const isSelected = option.value === value

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value)
                                    closeMenu()
                                }}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${isSelected ? `${palette.primaryButton} ${palette.primaryButtonText}` : "text-white hover:bg-white/[0.06]"}`}
                            >
                                {option.flagUrl ? (
                                    <img src={option.flagUrl} alt="" className="h-5 w-7 shrink-0 rounded-sm object-cover shadow-lg" />
                                ) : (
                                    <span className="h-5 w-7 shrink-0" />
                                )}
                                <span className="min-w-0 truncate">{option.label}</span>
                            </button>
                        )
                    }) : (
                        <div className="px-3 py-4 text-sm font-bold text-white/45">
                            {t.common.noMatches}
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    )
}
