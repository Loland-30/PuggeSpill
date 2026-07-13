import { useEffect, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Play, X } from "lucide-react"
import { useUISound } from "../audio/useUISound"
import type { Deck } from "../api/decks"
import type { ActiveGameModifier, GameDirection, RoundLimit } from "../api/gameSession"
import { languages } from "../data/languages"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"
import { readGameplaySettings, resolveDefaultGameDirection, toRoundLimit } from "../utils/gameplaySettings"
import GradientFrame from "./GradientFrame"
import { MODIFIER_DEFINITIONS, type ModifierCategory, type ModifierDefinition } from "./mods/modifierData"
import { formatScoreMultiplier, getModifierScoreLabel, getModifierScoreMultiplier, toggleModifier } from "./mods/modifierUtils"
import useMobileNavigation from "./navigation/useMobileNavigation"

interface Props {
    isOpen: boolean
    deck: Deck
    onSelect: (
        direction: GameDirection,
        modifiers: ActiveGameModifier[],
        roundLimit: RoundLimit
    ) => void
    onClose: () => void
    variant?: "singleplayer" | "multiplayer"
    primaryLabel?: string
    disabledModifiers?: ActiveGameModifier[]
    gameModeLocked?: boolean
    gameModeLockedMessage?: string
}

interface ModeOption {
    direction: GameDirection
    title: string
    description: string
    visual: ReactNode
}

interface RoundLimitOption {
    label: string
    value: RoundLimit
}

export default function GameModeModal({
    isOpen,
    deck,
    onSelect,
    onClose,
    primaryLabel = "Start game",
    disabledModifiers = [],
    gameModeLocked = false,
    gameModeLockedMessage
}: Props) {
    const [selectedDirection, setSelectedDirection] = useState<GameDirection>("original")
    const [modifiers, setModifiers] = useState<ActiveGameModifier[]>([])
    const [roundLimit, setRoundLimit] = useState<RoundLimit>(() => toRoundLimit(readGameplaySettings().defaultRoundLength))
    const [activeModifierCategory, setActiveModifierCategory] = useState<ModifierCategory>("easier")
    const [displayDeck, setDisplayDeck] = useState<Deck | null>(deck ?? null)
    const { t } = useI18n()
    const { palette } = useTheme()
    const { playHoverSound } = useUISound()
    const { setHidden: setMobileNavigationHidden } = useMobileNavigation()

    useEffect(() => {
        if (isOpen && deck) {
            const gameplaySettings = readGameplaySettings()
            setDisplayDeck(deck)
            setSelectedDirection(resolveDefaultGameDirection(deck, gameplaySettings.defaultGameDirection))
            setRoundLimit(toRoundLimit(gameplaySettings.defaultRoundLength))
        }
    }, [isOpen, deck])

    useEffect(() => {
        if (!isOpen) return

        setMobileNavigationHidden(true)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        return () => {
            setMobileNavigationHidden(false)
            document.body.style.overflow = previousOverflow
        }
    }, [isOpen, setMobileNavigationHidden])

    const activeDeck = deck ?? displayDeck

    if (!activeDeck) return null

    const lang1 = languages.find(language => language.code === activeDeck.language)
    const lang2 = languages.find(language => language.code === activeDeck.translationLanguage)
    const lang1Label = lang1?.label ?? activeDeck.language
    const lang2Label = lang2?.label ?? activeDeck.translationLanguage
    const activeModifiers = modifiers.filter(modifier => !disabledModifiers.includes(modifier))
    const scoreMultiplier = getModifierScoreMultiplier(activeModifiers)

    const roundLimitOptions: RoundLimitOption[] = [
        { label: `10 ${t.gameMode.questions}`, value: 10 },
        { label: `25 ${t.gameMode.questions}`, value: 25 },
        { label: `50 ${t.gameMode.questions}`, value: 50 },
        { label: `100 ${t.gameMode.questions}`, value: 100 },
        { label: t.gameMode.endless, value: null }
    ]

    const modeOptions: ModeOption[] = [
        {
            direction: "original",
            title: `${lang1Label} -> ${lang2Label}`,
            description: `Practice from ${lang1Label} to ${lang2Label}`,
            visual: (
                <FlagPair
                    left={<LanguageDot flagUrl={lang1?.flagUrl} label={lang1Label} />}
                    right={<LanguageDot flagUrl={lang2?.flagUrl} label={lang2Label} />}
                />
            )
        },
        {
            direction: "translation",
            title: `${lang2Label} -> ${lang1Label}`,
            description: `Practice from ${lang2Label} to ${lang1Label}`,
            visual: (
                <FlagPair
                    left={<LanguageDot flagUrl={lang2?.flagUrl} label={lang2Label} />}
                    right={<LanguageDot flagUrl={lang1?.flagUrl} label={lang1Label} />}
                />
            )
        },
        {
            direction: "mixed",
            title: t.gameMode.mixed,
            description: "Practice both directions",
            visual: (
                <div className="rounded-2xl bg-white/10 px-6 py-4 text-4xl font-black leading-none text-white shadow-inner">
                    A/B
                </div>
            )
        }
    ]

    function handleToggleModifier(modifier: ActiveGameModifier) {
        if (disabledModifiers.includes(modifier)) return
        setModifiers(currentModifiers => toggleModifier(currentModifiers, modifier))
    }

    const primaryActionLabel = primaryLabel

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="game-mode-backdrop"
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/65 p-2 backdrop-blur-sm sm:px-4 sm:py-8"
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    onClick={onClose}
                >
                    <motion.div
                        className="max-h-[calc(100dvh-1rem)] w-full max-w-[82rem] overflow-y-auto overscroll-contain rounded-[1.5rem] sm:max-h-[calc(100dvh-4rem)] sm:w-[min(94vw,82rem)] sm:rounded-[2rem]"
                        initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 8, filter: "blur(3px)" }}
                        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                        onClick={event => event.stopPropagation()}
                    >
                        <GradientFrame
                            glass
                            glow
                            radius={32}
                            radiusClass="rounded-[2rem]"
                            className="shadow-2xl"
                            contentClassName="p-4 sm:p-6 md:p-8"
                        >
                <div className="flex flex-col gap-5 sm:gap-7">
                    <header className="flex items-start justify-between gap-5">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
                                Set up your game
                            </h2>
                            <p className="mt-2 max-w-xl text-sm font-semibold text-white/65 md:text-base">
                                Choose mode, question count, and run modifiers for {activeDeck.name}.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            onMouseEnter={playHoverSound}
                            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${palette.border} bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white`}
                            aria-label={t.gameMode.closeLabel}
                        >
                            <X size={21} strokeWidth={2.7} />
                        </button>
                    </header>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                        <section>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <SectionHeading label={t.gameMode.chooseGameMode} />
                                {gameModeLocked && (
                                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/55">
                                        {gameModeLockedMessage ?? "Waiting for host to choose game mode"}
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
                                {modeOptions.map(option => (
                                    <ModeCard
                                        key={option.direction}
                                        option={option}
                                        selected={selectedDirection === option.direction}
                                        onSelect={setSelectedDirection}
                                        disabled={gameModeLocked}
                                        palette={palette}
                                    />
                                ))}
                            </div>
                        </section>

                        <section>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <SectionHeading label={t.gameMode.length} />
                                {gameModeLocked && (
                                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/55">
                                        Host controlled
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 flex flex-col gap-3">
                                {roundLimitOptions.map(option => (
                                    <LengthOption
                                        key={option.label}
                                        option={option}
                                        selected={option.value === roundLimit}
                                        onSelect={setRoundLimit}
                                        disabled={gameModeLocked}
                                        palette={palette}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>

                    <section className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md sm:rounded-[1.75rem] sm:p-5 md:p-6">
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <SectionHeading label={t.gameMode.mods} />
                                <p className="mt-1 text-sm font-semibold text-white/45">
                                    Selected score: {formatScoreMultiplier(scoreMultiplier)}
                                </p>
                            </div>

                            {activeModifiers.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setModifiers([])}
                                    onMouseEnter={playHoverSound}
                                    className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/[0.09] hover:text-white"
                                >
                                    Clear mods
                                </button>
                            )}
                        </div>

                        <div className="mb-5">
                            <ModifierCategorySwitch
                                activeCategory={activeModifierCategory}
                                onChange={setActiveModifierCategory}
                                palette={palette}
                            />
                        </div>

                        <div>
                            <ModifierGroup
                                category={activeModifierCategory}
                                selectedModifiers={activeModifiers}
                                onToggle={handleToggleModifier}
                                disabledModifiers={disabledModifiers}
                                palette={palette}
                            />
                        </div>
                    </section>

                    <div className="sticky -bottom-4 z-10 flex flex-col gap-3 border-t border-white/10 bg-slate-950/90 px-1 py-3 backdrop-blur-xl sm:static sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                        <p className="text-sm font-semibold text-white/45">
                            {roundLimit === null ? t.gameMode.endless : `${roundLimit} ${t.gameMode.questions}`} | {formatScoreMultiplier(scoreMultiplier)}
                        </p>

                        <button
                            type="button"
                            onClick={() => onSelect(selectedDirection, activeModifiers, roundLimit)}
                            onMouseEnter={playHoverSound}
                            className={`inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-[0.14em] shadow-xl transition hover:-translate-y-0.5 sm:w-auto sm:px-8 sm:py-4 sm:text-base sm:tracking-[0.18em] ${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}`}
                        >
                            {primaryActionLabel}
                            <Play size={18} fill="currentColor" strokeWidth={2.4} />
                        </button>
                    </div>
                </div>
                        </GradientFrame>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function SectionHeading({ label }: { label: string }) {
    return (
        <h3 className="text-xs font-black uppercase tracking-[0.22em] text-white/55">
            {label}
        </h3>
    )
}

function ModeCard({ option, selected, onSelect, disabled = false, palette }: {
    option: ModeOption
    selected: boolean
    onSelect: (direction: GameDirection) => void
    disabled?: boolean
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const { playHoverSound } = useUISound()

    return (
        <button
            type="button"
            onClick={() => onSelect(option.direction)}
            onMouseEnter={playHoverSound}
            disabled={disabled}
            className={`group relative min-h-[11rem] rounded-2xl border p-4 text-left transition duration-200 sm:min-h-[13rem] sm:rounded-3xl sm:p-5 md:min-h-[15rem] ${
                disabled ? "cursor-not-allowed opacity-70" : "hover:bg-white/[0.07]"
            } ${
                selected
                    ? `${palette.border} ${palette.card} ${palette.glow}`
                    : `border-white/10 bg-white/[0.035] ${disabled ? "" : "hover:border-white/25"}`
            }`}
        >
            {selected && (
                <span className={`absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full ${palette.primaryButton} ${palette.primaryButtonText}`}>
                    <Check size={16} strokeWidth={3} />
                </span>
            )}

            <div className="flex h-full flex-col items-center justify-center gap-3 text-center sm:gap-5">
                {option.visual}
                <div>
                    <p className="text-xl font-black tracking-tight text-white sm:text-2xl">{option.title}</p>
                    <p className="mt-2 text-sm font-semibold leading-5 text-white/58">{option.description}</p>
                </div>
            </div>
        </button>
    )
}

function LengthOption({ option, selected, onSelect, disabled = false, palette }: {
    option: RoundLimitOption
    selected: boolean
    onSelect: (value: RoundLimit) => void
    disabled?: boolean
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const { playHoverSound } = useUISound()

    return (
        <button
            type="button"
            onClick={() => onSelect(option.value)}
            onMouseEnter={playHoverSound}
            disabled={disabled}
            className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                disabled ? "cursor-not-allowed opacity-70" : "hover:bg-white/[0.07]"
            } ${
                selected
                    ? `${palette.border} ${palette.card} ${palette.glow}`
                    : `border-white/10 bg-white/[0.035] ${disabled ? "" : "hover:border-white/25"}`
            }`}
        >
            <span className="text-base font-black text-white">{option.label}</span>
            <span className={`grid h-5 w-5 place-items-center rounded-full border ${selected ? `${palette.primaryButton} ${palette.primaryButtonText} border-transparent` : "border-white/20"}`}>
                {selected && <Check size={13} strokeWidth={3} />}
            </span>
        </button>
    )
}

function ModifierCategorySwitch({ activeCategory, onChange, palette }: {
    activeCategory: ModifierCategory
    onChange: (category: ModifierCategory) => void
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const { t } = useI18n()
    const { playHoverSound } = useUISound()
    const options: Array<{ label: string; value: ModifierCategory }> = [
        { label: t.gameMode.easier, value: "easier" },
        { label: t.gameMode.harder, value: "harder" }
    ]

    return (
        <div className="inline-flex h-11 w-full items-center rounded-full border border-white/10 bg-black/30 p-1 backdrop-blur-md sm:w-auto">
            {options.map(option => {
                const isActive = activeCategory === option.value

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        onMouseEnter={playHoverSound}
                        className={`flex h-9 min-w-0 flex-1 items-center justify-center rounded-full px-4 text-sm font-black transition sm:min-w-[6rem] ${
                            isActive
                                ? `${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}`
                                : "text-white/55 hover:text-white"
                        }`}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}

function ModifierGroup({ category, selectedModifiers, onToggle, disabledModifiers, palette }: {
    category: ModifierCategory
    selectedModifiers: ActiveGameModifier[]
    onToggle: (modifier: ActiveGameModifier) => void
    disabledModifiers: ActiveGameModifier[]
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const modifiers = MODIFIER_DEFINITIONS.filter(modifier => modifier.category === category)

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modifiers.map(modifier => (
                <ModifierChip
                    key={modifier.id}
                    modifier={modifier}
                    selected={selectedModifiers.includes(modifier.id)}
                    onToggle={onToggle}
                    disabled={disabledModifiers.includes(modifier.id)}
                    palette={palette}
                />
            ))}
        </div>
    )
}

function ModifierChip({ modifier, selected, onToggle, disabled, palette }: {
    modifier: ModifierDefinition
    selected: boolean
    onToggle: (modifier: ActiveGameModifier) => void
    disabled: boolean
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const { playHoverSound } = useUISound()

    return (
        <button
            type="button"
            onClick={() => onToggle(modifier.id)}
            onMouseEnter={playHoverSound}
            disabled={disabled}
            className={`min-h-24 rounded-2xl border p-3 text-left transition sm:p-4 ${
                disabled
                    ? "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-45"
                    : "hover:bg-white/[0.07]"
            } ${
                selected
                    ? `${palette.border} ${palette.card} ${palette.glow}`
                    : "border-white/10 bg-white/[0.035] hover:border-white/25"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-base font-black text-white">{modifier.name}</p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-white/55">{modifier.shortDescription}</p>
                </div>

                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${selected ? `${palette.primaryButton} ${palette.primaryButtonText} border-transparent` : "border-white/20"}`}>
                    {selected && <Check size={14} strokeWidth={3} />}
                </span>
            </div>

            <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-white/40">
                {disabled ? "Not available in multiplayer" : getModifierScoreLabel(modifier.id)}
            </p>
        </button>
    )
}

function FlagPair({ left, right }: { left: ReactNode; right: ReactNode }) {
    return (
        <div className="flex items-center justify-center gap-4">
            {left}
            <span className="text-sm font-black uppercase tracking-[0.25em] text-white/35">
                {">"}
            </span>
            {right}
        </div>
    )
}

function LanguageDot({ flagUrl, label }: { flagUrl?: string; label: string }) {
    if (!flagUrl) {
        return (
            <div
                aria-label={label}
                className="h-12 w-12 rounded-full bg-white/10 shadow-lg sm:h-16 sm:w-16"
            />
        )
    }

    return (
        <img
            src={flagUrl}
            alt={label}
            className="h-12 w-12 rounded-full object-cover shadow-lg sm:h-16 sm:w-16"
        />
    )
}
