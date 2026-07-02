import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Award, Box, Clock, Library, Play, Settings2 } from "lucide-react"
import type { Deck } from "../../api/decks"
import type { ActiveGameModifier, GameDirection, RoundLimit } from "../../api/gameSession"
import resultStatPopupSoundUrl from "../../assets/SFX/result-screen-stat-popup-sound.mp3"
import { preloadOneShotAudio, useOneShotAudio } from "../../audio/useOneShotAudio"
import { languages } from "../../data/languages"
import GradeRing from "../results/GradeRing"
import { useTheme } from "../../theme/ThemeContext"
import { getRankFromAccuracy } from "../../utils/rankUtils"

export interface RunRank {
    rank: string
    label: string
    color: string
}

export interface RunResultStatItem {
    label: string
    value: number | string
}

interface RunResultHighlight {
    label: string
    value: number | string | null
    badge?: string
}

interface LegacyRunResultScreenProps {
    outcome: "complete" | "gameOver" | "trialPassed" | "trialFailed"
    modeLabel: string
    rank: RunRank
    title: string
    subtitle?: string
    stats: RunResultStatItem[]
    highlight?: RunResultHighlight
    primaryActionLabel?: string
    secondaryActionLabel?: string
    onPrimaryAction: () => void
    onSecondaryAction: () => void
}

interface GameRunResultScreenProps {
    outcome: "complete" | "gameOver"
    deck: Deck | null
    direction: GameDirection
    modifiers: ActiveGameModifier[]
    roundLimit: RoundLimit
    backgroundImageUrl: string
    finalScore: number
    highScore: number | null
    isNewHighScore: boolean
    correctAnswers: number
    wrongAnswers: number
    totalAnswers: number
    bestCombo: number
    enemiesDefeated: number
    onPlayAgain: () => void
    onChangeSetup: () => void
    onReturnToDecks: () => void
}

type RunResultScreenProps = LegacyRunResultScreenProps | GameRunResultScreenProps
type ResultTab = "general" | "rushHour"
type ResultAction = "play" | "setup" | "decks"

const STAT_REVEAL_DELAY_MS = 750
const RING_FILL_DURATION_MS = 1050

export default function RunResultScreen(props: RunResultScreenProps) {
    if ("modeLabel" in props) return <LegacyRunResultScreen {...props} />

    return <GameRunResultScreen {...props} />
}

function GameRunResultScreen({
    deck,
    direction,
    roundLimit,
    backgroundImageUrl,
    finalScore,
    highScore,
    isNewHighScore,
    correctAnswers,
    wrongAnswers,
    totalAnswers,
    bestCombo,
    enemiesDefeated,
    onPlayAgain,
    onChangeSetup,
    onReturnToDecks
}: GameRunResultScreenProps) {
    const { palette } = useTheme()
    const [activeTab, setActiveTab] = useState<ResultTab>("general")
    const [actionsOpen, setActionsOpen] = useState(false)
    const [activeAction, setActiveAction] = useState<ResultAction | null>(null)
    const [revealStep, setRevealStep] = useState(0)
    const [statPopupSoundKey, setStatPopupSoundKey] = useState(0)
    const overlayRef = useRef<HTMLDivElement>(null)
    const accuracy = totalAnswers === 0 ? 0 : Math.round((correctAnswers / totalAnswers) * 100)
    const rank = getRankFromAccuracy(accuracy)
    const highScoreValue = highScore ?? finalScore

    const languageMeta = useMemo(() => {
        const sourceLanguage = languages.find(language => language.code === deck?.language)
        const targetLanguage = languages.find(language => language.code === deck?.translationLanguage)
        return {
            source: sourceLanguage?.label ?? deck?.language ?? "Source",
            sourceFlag: sourceLanguage?.flagUrl,
            target: targetLanguage?.label ?? deck?.translationLanguage ?? "Target",
            targetFlag: targetLanguage?.flagUrl
        }
    }, [deck])

    const directionLabel = getDirectionLabel(direction, languageMeta.source, languageMeta.target)
    const lengthLabel = roundLimit === null ? "Endless" : `${roundLimit} questions`
    const showRingFill = revealStep >= 6
    const showContinue = revealStep >= 7
    const handleRingAnimationComplete = useCallback(() => {
        setRevealStep(step => Math.max(step, 7))
    }, [])

    useEffect(() => {
        preloadOneShotAudio(resultStatPopupSoundUrl)
    }, [])

    useEffect(() => {
        if (revealStep < 1 || revealStep > 4) return

        setStatPopupSoundKey(key => key + 1)
    }, [revealStep])

    useEffect(() => {
        if (!actionsOpen) return

        setActiveAction(null)
        overlayRef.current?.focus()

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setActionsOpen(false)
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [actionsOpen])

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

        if (prefersReducedMotion) {
            setRevealStep(7)
            return
        }

        setRevealStep(0)

        const timers = [
            window.setTimeout(() => setRevealStep(1), STAT_REVEAL_DELAY_MS),
            window.setTimeout(() => setRevealStep(2), STAT_REVEAL_DELAY_MS * 2),
            window.setTimeout(() => setRevealStep(3), STAT_REVEAL_DELAY_MS * 3),
            window.setTimeout(() => setRevealStep(4), STAT_REVEAL_DELAY_MS * 4),
            window.setTimeout(() => setRevealStep(5), STAT_REVEAL_DELAY_MS * 5),
            window.setTimeout(() => setRevealStep(6), STAT_REVEAL_DELAY_MS * 6)
        ]

        return () => {
            timers.forEach(timer => window.clearTimeout(timer))
        }
    }, [finalScore, correctAnswers, wrongAnswers, bestCombo, accuracy])

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            {statPopupSoundKey > 0 && <ResultStatPopupSound key={statPopupSoundKey} />}

            <img
                src={backgroundImageUrl}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.34)_45%,rgba(0,0,0,0.58)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.62)_100%)]" />

            <main className="relative z-10 mx-auto grid min-h-screen w-[min(92vw,96rem)] grid-rows-[auto_1fr] py-8">
                <h1 className="text-center text-4xl font-black tracking-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.45)] md:text-5xl">
                    Results
                </h1>

                <section className="grid min-h-0 items-center gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(25rem,34rem)] lg:gap-20 xl:grid-cols-[minmax(46rem,1fr)_clamp(30rem,34vw,38rem)] xl:gap-28 2xl:gap-32">
                    <div className="flex min-h-0 flex-col justify-center gap-20 lg:gap-28">
                        <div className="max-w-3xl text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.45)]">
                            <div className="flex flex-wrap items-end gap-4">
                                <h2 className="text-4xl font-black tracking-tight md:text-5xl">
                                    {deck?.name ?? "Deck name"}
                                </h2>

                                <div className="flex items-start gap-3 pt-1">
                                    <FlagStack flagUrl={languageMeta.sourceFlag} />
                                    <FlagStack flagUrl={languageMeta.targetFlag} label="Learning" />
                                </div>
                            </div>

                            <div className="mt-5 space-y-2 text-xl font-semibold text-white/90">
                                <InfoLine icon={<Box size={23} />} label={directionLabel} />
                                <InfoLine icon={<Clock size={24} />} label={lengthLabel} />
                            </div>
                        </div>

                        <div className="max-w-[64rem]">
                            <div className="mb-5 flex items-center gap-10">
                                <TabButton label="General" active={activeTab === "general"} onClick={() => setActiveTab("general")} />
                                <TabButton label="Rush hour" active={activeTab === "rushHour"} onClick={() => setActiveTab("rushHour")} />
                            </div>

                            {activeTab === "general" ? (
                                <div className="grid gap-4 sm:grid-cols-2 xl:[grid-template-columns:repeat(4,minmax(13rem,1fr))]">
                                    <StatCard label="Answered correctly" value={correctAnswers} revealed={revealStep >= 1} />
                                    <StatCard label="Answered incorrectly" value={wrongAnswers} revealed={revealStep >= 2} />
                                    <StatCard label="Highest Combo" value={bestCombo} revealed={revealStep >= 3} />
                                    <StatCard label="Accuracy" value={`${accuracy}%`} revealed={revealStep >= 4} />
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-6 text-white shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-md">
                                    <p className="text-lg font-bold">Rush Hour summary</p>
                                    <p className="mt-2 text-sm font-semibold text-white/55">
                                        Detailed Rush Hour result stats are not available for this run yet.
                                    </p>
                                    <p className="mt-5 text-4xl font-black">{enemiesDefeated}</p>
                                    <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-white/45">Enemies defeated</p>
                                </div>
                            )}

                            <button
                                type="button"
                                disabled={!showContinue}
                                tabIndex={showContinue ? 0 : -1}
                                onClick={() => {
                                    if (showContinue) setActionsOpen(true)
                                }}
                                className={`mt-10 rounded-full px-10 py-3 text-lg font-bold shadow-[0_18px_45px_rgba(0,0,0,0.26)] transition-all duration-300 ease-out ${showContinue ? `translate-y-0 opacity-100 hover:-translate-y-0.5 ${palette.primaryButton} ${palette.primaryButtonText}` : "pointer-events-none translate-y-2 bg-white/20 text-white/40 opacity-0"}`}
                            >
                                Continue
                            </button>
                        </div>
                    </div>

                    <aside className="flex flex-col items-center justify-center gap-10 text-center">
                        <GradeRing
                            rank={rank}
                            accuracy={accuracy}
                            animate={revealStep === 6}
                            animationDurationMs={RING_FILL_DURATION_MS}
                            fillVisible={showRingFill}
                            onAnimationComplete={handleRingAnimationComplete}
                            sizeClassName="h-[clamp(24rem,34vw,36rem)] w-[clamp(24rem,34vw,36rem)]"
                        />

                        <div className="text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.48)]">
                            <p className="text-3xl font-medium">Final Score</p>
                            <p className={`mt-3 text-6xl font-black tracking-wide transition-all duration-300 ease-out md:text-7xl ${revealStep >= 5 ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-90 opacity-0"}`}>
                                {formatResultNumber(finalScore)}
                            </p>
                            <p className={`mt-7 flex items-center justify-center gap-4 text-2xl font-semibold text-white/85 transition-all duration-300 ease-out ${revealStep >= 5 ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-90 opacity-0"}`}>
                                <Award size={30} strokeWidth={2.2} />
                                <span>{formatResultNumber(highScoreValue)}</span>
                            </p>
                            {isNewHighScore && (
                                <p className={`mt-3 text-sm font-black uppercase tracking-[0.28em] ${palette.accentText}`}>
                                    New high score!
                                </p>
                            )}
                        </div>
                    </aside>
                </section>
            </main>

            {actionsOpen && (
                <div
                    className="fixed inset-0 z-50 grid place-items-center bg-black/62 px-6 backdrop-blur-md"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Run actions"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) setActionsOpen(false)
                    }}
                >
                    <div
                        ref={overlayRef}
                        tabIndex={-1}
                        className="flex w-full max-w-[26rem] flex-col items-stretch gap-12 outline-none"
                    >
                        <ActionButton
                            icon={<Play size={28} strokeWidth={2.2} />}
                            label="Play again"
                            onClick={onPlayAgain}
                            accentTextClass={palette.accentText}
                            active={activeAction === "play"}
                            onActive={() => setActiveAction("play")}
                            onInactive={() => setActiveAction(current => current === "play" ? null : current)}
                        />
                        <ActionButton
                            icon={<Settings2 size={28} strokeWidth={2.1} />}
                            label="Change Setup"
                            onClick={onChangeSetup}
                            accentTextClass={palette.accentText}
                            active={activeAction === "setup"}
                            onActive={() => setActiveAction("setup")}
                            onInactive={() => setActiveAction(current => current === "setup" ? null : current)}
                        />
                        <ActionButton
                            icon={<Library size={28} strokeWidth={2.1} />}
                            label="Return to decks"
                            onClick={onReturnToDecks}
                            accentTextClass={palette.accentText}
                            active={activeAction === "decks"}
                            onActive={() => setActiveAction("decks")}
                            onInactive={() => setActiveAction(current => current === "decks" ? null : current)}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

function LegacyRunResultScreen({
    outcome,
    modeLabel,
    rank,
    title,
    subtitle,
    stats,
    highlight,
    primaryActionLabel = "Play again",
    secondaryActionLabel = "Exit",
    onPrimaryAction,
    onSecondaryAction
}: LegacyRunResultScreenProps) {
    const positiveOutcome = outcome === "complete" || outcome === "trialPassed"

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="text-center">
                <p className={`text-sm font-semibold uppercase tracking-[0.25em] ${positiveOutcome ? "text-orange-400" : "text-gray-400"}`}>
                    {modeLabel}
                </p>
                <h1 className={`text-8xl font-black ${rank.color}`}>{rank.rank}</h1>
                <p className="text-2xl font-bold text-gray-800">{title}</p>
                {subtitle && (
                    <p className="mt-2 text-base font-semibold text-gray-500">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map(stat => (
                    <LegacyRunResultStat
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                    />
                ))}
            </div>

            {highlight && (
                <div className="space-y-2 text-center">
                    <p className="text-base text-gray-500">
                        {highlight.label}: {highlight.value ?? "-"}
                    </p>
                    {highlight.badge && (
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">
                            {highlight.badge}
                        </p>
                    )}
                </div>
            )}

            <div className="flex gap-4">
                <button
                    onClick={onPrimaryAction}
                    className="rounded-full bg-orange-400 px-8 py-3 font-semibold text-white transition hover:bg-orange-500"
                >
                    {primaryActionLabel}
                </button>
                <button
                    onClick={onSecondaryAction}
                    className="rounded-full px-8 py-3 text-gray-400 transition hover:text-gray-600"
                >
                    {secondaryActionLabel}
                </button>
            </div>
        </div>
    )
}

function FlagStack({ flagUrl, label }: { flagUrl?: string; label?: string }) {
    return (
        <span className="grid min-w-[4.25rem] justify-items-center gap-1 text-xs font-semibold text-white/90">
            {flagUrl && <img src={flagUrl} alt="" className="h-11 w-[4.25rem] rounded-md object-cover shadow-[0_8px_18px_rgba(0,0,0,0.32)]" />}
            {label && <span>{label}</span>}
        </span>
    )
}

function InfoLine({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <p className="flex items-center gap-3">
            <span className="text-white">{icon}</span>
            <span>{label}</span>
        </p>
    )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    const { palette } = useTheme()

    return (
        <button
            type="button"
            onClick={onClick}
            className={`text-xl font-semibold transition md:text-2xl ${active ? palette.accentText : "text-white hover:text-white/80"}`}
        >
            {label}
        </button>
    )
}

function StatCard({ label, value, revealed }: { label: string; value: number | string; revealed: boolean }) {
    return (
        <div className="min-h-32 min-w-52 rounded-xl border border-white/5 bg-black/32 px-6 py-5 text-center shadow-[0_18px_45px_rgba(0,0,0,0.24)] backdrop-blur-md">
            <p className="whitespace-nowrap text-base font-medium leading-snug text-white/90 md:text-lg">{label}</p>
            <p className={`mt-4 text-5xl font-black text-white transition-all duration-300 ease-out md:text-6xl ${revealed ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-90 opacity-0"}`}>
                {value}
            </p>
        </div>
    )
}

const ActionButton = forwardRef<HTMLButtonElement, {
    icon: ReactNode
    label: string
    onClick: () => void
    accentTextClass: string
    active: boolean
    onActive: () => void
    onInactive: () => void
}>(function ActionButton({
    icon,
    label,
    onClick,
    accentTextClass,
    active,
    onActive,
    onInactive
}, ref) {
    return (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            onMouseEnter={onActive}
            onMouseLeave={onInactive}
            onFocus={onActive}
            onBlur={onInactive}
            className="group relative h-16 w-full text-center text-3xl font-medium text-white outline-none md:text-4xl"
        >
            <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 transition duration-200 ${active ? `scale-100 opacity-100 ${accentTextClass}` : "scale-90 opacity-0 text-white"}`}
            >
                {icon}
            </span>
            <span className={`inline-block transition duration-200 ${active ? `translate-x-5 ${accentTextClass}` : "translate-x-0 text-white"}`}>
                {label}
            </span>
        </button>
    )
})

function LegacyRunResultStat({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-lg bg-white p-4 text-center shadow-sm">
            <p className="text-xs uppercase tracking-widest text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    )
}

function getDirectionLabel(direction: GameDirection, source: string, target: string) {
    if (direction === "original") return `${source} -> ${target}`
    if (direction === "translation") return `${target} -> ${source}`
    return "Mixed"
}

function formatResultNumber(value: number) {
    return new Intl.NumberFormat("nb-NO").format(value)
}

function ResultStatPopupSound() {
    const { theme } = useTheme()

    useOneShotAudio({
        source: resultStatPopupSoundUrl,
        enabled: theme.audio.audioEnabled,
        volume: theme.audio.uiVolume
    })

    return null
}
