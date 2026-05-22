import { useState, type ReactNode } from "react"
import { ChevronDown, X } from "lucide-react"
import type { Deck } from "../api/decks"
import type { ActiveGameModifier, GameDirection, RoundLimit } from "../api/gameSession"
import { languages } from "../data/languages"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"
import GradientFrame from "./GradientFrame"
import ModifierPicker from "./mods/ModifierPicker"
import { getModifierNames } from "./mods/modifierUtils"

interface Props {
    isOpen: boolean
    deck: Deck
    onSelect: (
        direction: GameDirection,
        modifiers: ActiveGameModifier[],
        roundLimit: RoundLimit
    ) => void
    onClose: () => void
}

interface ModeCardProps {
    title: string
    onClick: () => void
    children: ReactNode
}

interface RoundLimitOption {
    label: string
    value: RoundLimit
}

function ModeCard({ title, onClick, children }: ModeCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group text-left transition duration-200 ease-out focus:outline-none"
        >
            <GradientFrame
                radius={18}
                radiusClass="rounded-2xl"
                className="min-h-[13.25rem] transition duration-200 ease-out"
                fillClassName="bg-white/[0.025]"
                hoverFillClassName="group-hover:bg-white/[0.08]"
                contentClassName="flex min-h-[13.25rem] flex-col items-center justify-center gap-8 p-8"
            >
                <div className="flex flex-col items-center justify-center gap-6 text-white">
                    {children}

                    <p className="text-center text-[1.85rem] font-black leading-tight tracking-tight text-white">
                        {title}
                    </p>
                </div>
            </GradientFrame>
        </button>
    )
}

interface RoundLimitPickerProps {
    value: RoundLimit
    onChange: (value: RoundLimit) => void
}

function RoundLimitPicker({ value, onChange }: RoundLimitPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { t } = useI18n()
    const { palette } = useTheme()
    const roundLimitOptions: RoundLimitOption[] = [
        { label: `10 ${t.gameMode.questions}`, value: 10 },
        { label: `25 ${t.gameMode.questions}`, value: 25 },
        { label: `50 ${t.gameMode.questions}`, value: 50 },
        { label: `100 ${t.gameMode.questions}`, value: 100 },
        { label: t.gameMode.endless, value: null }
    ]

    const selectedOption =
        roundLimitOptions.find(option => option.value === value) ?? roundLimitOptions[1]

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(open => !open)}
                className="group flex items-center gap-2 rounded-full px-2.5 py-2 text-base font-bold text-white/80 transition hover:bg-white/5 hover:text-white"
            >
                <span>{t.gameMode.length}</span>

                <span className="font-black text-white">
                    {selectedOption.label}
                </span>

                <ChevronDown
                    size={16}
                    strokeWidth={3}
                    className={`transition ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl">
                    {roundLimitOptions.map(option => {
                        const isSelected = option.value === value

                        return (
                            <button
                                key={option.label}
                                type="button"
                                onClick={() => {
                                    onChange(option.value)
                                    setIsOpen(false)
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold transition ${isSelected ? `${palette.primaryButton} ${palette.primaryButtonText}` : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                            >
                                <span>{option.label}</span>

                                {isSelected && (
                                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-xs">
                                        ✓
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default function GameModeModal({ isOpen, deck, onSelect, onClose }: Props) {
    const [modifiers, setModifiers] = useState<ActiveGameModifier[]>([])
    const [showModifierPicker, setShowModifierPicker] = useState(false)
    const [roundLimit, setRoundLimit] = useState<RoundLimit>(25)
    const { t } = useI18n()
    const { palette } = useTheme()

    if (!isOpen || !deck) return null

    const lang1 = languages.find(language => language.code === deck.language)
    const lang2 = languages.find(language => language.code === deck.translationLanguage)

    const lang1Label = lang1?.label ?? deck.language
    const lang2Label = lang2?.label ?? deck.translationLanguage
    const modifierLabel = modifiers.length === 0 ? t.gameMode.modsNone : getModifierNames(modifiers)

    if (showModifierPicker) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 py-8 backdrop-blur-sm">
                <ModifierPicker
                    selectedModifiers={modifiers}
                    onChange={setModifiers}
                    onClose={() => setShowModifierPicker(false)}
                />
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 px-4 py-8 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-[min(94vw,72rem)] rounded-[2rem] bg-slate-900/45 p-7 shadow-2xl md:p-10"
                onClick={event => event.stopPropagation()}
            >
                <div className="flex flex-col gap-9">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-[2.4rem] font-black leading-tight tracking-tight text-white">
                            {t.gameMode.chooseGameMode}
                        </h2>

                        <div className="flex flex-wrap items-center gap-5">
                            <RoundLimitPicker
                                value={roundLimit}
                                onChange={setRoundLimit}
                            />

                            <button
                                type="button"
                                onClick={() => setShowModifierPicker(open => !open)}
                                className={`rounded-full px-2.5 py-2 text-base font-bold transition hover:bg-white/5 hover:text-white ${modifiers.length === 0 ? "text-white/80" : palette.accentText}`}
                            >
                                {t.gameMode.mods}: <span className="text-white">{modifierLabel}</span>
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className={`grid h-11 w-11 place-items-center rounded-full border ${palette.border} bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white`}
                                aria-label={t.gameMode.closeLabel}
                            >
                                <X size={21} strokeWidth={2.7} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <ModeCard
                            title={`${lang1Label} → ${lang2Label}`}
                            onClick={() => onSelect("original", modifiers, roundLimit)}
                        >
                            <div className="flex items-center justify-center gap-5">
                                <LanguageDot flagUrl={lang1?.flagUrl} label={lang1Label} />
                                <span className="text-xs font-black uppercase tracking-[0.25em] text-white/40">
                                    {t.gameMode.to}
                                </span>
                                <LanguageDot flagUrl={lang2?.flagUrl} label={lang2Label} />
                            </div>
                        </ModeCard>

                        <ModeCard
                            title={`${lang2Label} → ${lang1Label}`}
                            onClick={() => onSelect("translation", modifiers, roundLimit)}
                        >
                            <div className="flex items-center justify-center gap-5">
                                <LanguageDot flagUrl={lang2?.flagUrl} label={lang2Label} />
                                <span className="text-xs font-black uppercase tracking-[0.25em] text-white/40">
                                    {t.gameMode.to}
                                </span>
                                <LanguageDot flagUrl={lang1?.flagUrl} label={lang1Label} />
                            </div>
                        </ModeCard>

                        <ModeCard
                            title={t.gameMode.mixed}
                            onClick={() => onSelect("mixed", modifiers, roundLimit)}
                        >
                            <div className="rounded-2xl bg-white/10 px-8 py-6 text-[3.25rem] font-black leading-none text-white shadow-inner transition group-hover:bg-white/[0.14]">
                                A/B
                            </div>
                        </ModeCard>
                    </div>
                </div>
            </div>
        </div>
    )
}

function LanguageDot({ flagUrl, label }: { flagUrl?: string; label: string }) {
    if (!flagUrl) {
        return (
            <div
                aria-label={label}
                className="h-[4.5rem] w-[4.5rem] rounded-full bg-white/10 shadow-lg"
            />
        )
    }

    return (
        <img
            src={flagUrl}
            alt={label}
            className="h-[4.5rem] w-[4.5rem] rounded-full object-cover shadow-lg"
        />
    )
}
