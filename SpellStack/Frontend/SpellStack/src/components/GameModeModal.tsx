import { useState, type ReactNode } from "react"
import { ChevronDown, X } from "lucide-react"
import type { Deck } from "../api/decks"
import type { ActiveGameModifier, GameDirection, RoundLimit } from "../api/gameSession"
import { languages } from "../data/languages"
import { useI18n } from "../i18n/I18nContext"
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
    description: string
    onClick: () => void
    children: ReactNode
}

interface RoundLimitOption {
    label: string
    value: RoundLimit
}

function ModeCard({ title, description, onClick, children }: ModeCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group text-left transition hover:-translate-y-1 focus:outline-none"
        >
            <GradientFrame
                radius={18}
                radiusClass="rounded-2xl"
                className="min-h-[230px]"
                contentClassName="flex min-h-[230px] flex-col justify-between p-6"
            >
                <div className="flex flex-col items-center justify-center gap-5 text-white">
                    {children}

                    <div className="text-center">
                        <p className="text-2xl font-black tracking-tight text-white">
                            {title}
                        </p>
                    </div>
                </div>

                <p className="text-center text-sm font-medium text-white/65 transition group-hover:text-white">
                    {description}
                </p>
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
                className="flex items-center gap-3 rounded-full bg-white/90 px-5 py-2 text-sm font-bold text-gray-800 shadow-xl transition hover:bg-white"
            >
                <span className="text-gray-500">{t.gameMode.length}</span>

                <span className="font-black">
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
                                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold transition ${isSelected ? "bg-orange-400 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
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

    if (!isOpen || !deck) return null

    const lang1 = languages.find(language => language.code === deck.language)
    const lang2 = languages.find(language => language.code === deck.translationLanguage)

    const lang1Label = lang1?.label ?? deck.language
    const lang2Label = lang2?.label ?? deck.translationLanguage
    const modifierLabel = modifiers.length === 0 ? t.gameMode.modsNone : getModifierNames(modifiers)

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-8"
            onClick={onClose}
        >
            <div
                className="w-full max-w-5xl"
                onClick={event => event.stopPropagation()}
            >
                <GradientFrame
                    glow
                    radius={24}
                    radiusClass="rounded-3xl"
                    contentClassName="p-6 sm:p-8"
                >
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/45">
                                    SpellStack
                                </p>

                                <h2 className="text-3xl font-black tracking-tight text-white">
                                    {t.gameMode.chooseGameMode}
                                </h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <RoundLimitPicker
                                    value={roundLimit}
                                    onChange={setRoundLimit}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowModifierPicker(open => !open)}
                                    className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold shadow-xl transition ${modifiers.length === 0 ? "bg-white/90 text-gray-800 hover:bg-white" : "bg-orange-400 text-white hover:bg-orange-500"}`}
                                >
                                    <span className="grid h-6 w-6 place-items-center rounded-full bg-black/10 text-xs">
                                        +
                                    </span>

                                    {t.gameMode.mods}: {modifierLabel}
                                </button>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-gray-800 shadow-xl transition hover:bg-orange-400 hover:text-white"
                                    aria-label={t.gameMode.closeLabel}
                                >
                                    <X size={22} strokeWidth={2.7} />
                                </button>
                            </div>
                        </div>

                        {showModifierPicker ? (
                            <ModifierPicker
                                selectedModifiers={modifiers}
                                onChange={setModifiers}
                                onClose={() => setShowModifierPicker(false)}
                            />
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <ModeCard
                                    title={`${lang1Label} → ${lang2Label}`}
                                    description={t.gameMode.translateFrom.replace("{language}", lang1Label)}
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
                                    description={t.gameMode.translateFrom.replace("{language}", lang2Label)}
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
                                    description={t.gameMode.randomDirectionEachWord}
                                    onClick={() => onSelect("mixed", modifiers, roundLimit)}
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="rounded-2xl bg-white/10 px-6 py-4 text-4xl font-black text-white shadow-inner">
                                            A/B
                                        </div>

                                        <p className="text-center text-sm font-bold text-white/65">
                                            {t.gameMode.bothDirections}
                                        </p>
                                    </div>
                                </ModeCard>
                            </div>
                        )}
                    </div>
                </GradientFrame>
            </div>
        </div>
    )
}

function LanguageDot({ flagUrl, label }: { flagUrl?: string; label: string }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <img
                src={flagUrl}
                alt={label}
                className="h-14 w-14 rounded-full object-cover shadow-lg"
            />

            <p className="text-sm font-bold text-white/80">
                {label}
            </p>
        </div>
    )
}