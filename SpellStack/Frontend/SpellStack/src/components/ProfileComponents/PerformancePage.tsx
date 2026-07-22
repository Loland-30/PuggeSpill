import { useEffect, useMemo, useState } from "react"
import { getGameHistory, type GameRunHistory } from "../../api/gameSession"
import { getDecks, getDeckTrialStars, type Deck } from "../../api/decks"
import GradeRing, { getRingPalette } from "../results/GradeRing"
import { useTheme } from "../../theme/ThemeContext"
import { useI18n } from "../../i18n/I18nContext"
import { getNextRankText, getRankFromAccuracy, type RankLabel } from "../../utils/rankUtils"
import type { ProfileComponentProps } from "./types"
import { isDeckTrialEligible, TRIAL_MAXIMUM_STARS } from "../../utils/trialRules"

const performanceTabs = ["General", "Rush Hour", "Trials"] as const
type PerformanceTab = typeof performanceTabs[number]

const chartModes = ["accuracy", "score"] as const
type ChartMode = typeof chartModes[number]

interface PerformanceSnapshot {
    averageAccuracy: number
    rank: RankLabel
    responseTime: string
    highestCombo: number
    recentAccuracyRuns: number[]
    recentScoreRuns: number[]
    rushHoursTriggered: number
    rushHoursCompleted: number
    longestRushHourDuration: number | null
}

export default function PerformancePage({
    profileLanguages,
    currentLanguage,
    onSelectLanguage
}: ProfileComponentProps) {
    const [activeTab, setActiveTab] = useState<PerformanceTab>("General")
    const [chartMode, setChartMode] = useState<ChartMode>("accuracy")
    const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
    const [gameHistory, setGameHistory] = useState<GameRunHistory[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [historyError, setHistoryError] = useState<string | null>(null)
    const [decks, setDecks] = useState<Deck[]>([])

    useEffect(() => {
        let cancelled = false

        setHistoryLoading(true)
        setHistoryError(null)

        getGameHistory(currentLanguage.code, 10)
            .then(runs => {
                if (!cancelled) setGameHistory(runs)
            })
            .catch(() => {
                if (!cancelled) {
                    setGameHistory([])
                    setHistoryError("Could not load run history")
                }
            })
            .finally(() => {
                if (!cancelled) setHistoryLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [currentLanguage.code])

    useEffect(() => {
        let cancelled = false

        getDecks()
            .then(items => {
                if (!cancelled) setDecks(items)
            })
            .catch(() => {
                if (!cancelled) setDecks([])
            })

        return () => {
            cancelled = true
        }
    }, [])

    const performance = useMemo(() => {
        return getPerformanceSnapshot(gameHistory)
    }, [gameHistory])

    const trialProgress = useMemo(() => {
        const eligibleDecks = decks.filter(deck => {
            return isDeckTrialEligible(deck.words.length) && deck.learningLanguage === currentLanguage.code
        })
        const totalStars = eligibleDecks.reduce((sum, deck) => sum + getDeckTrialStars(deck), 0)
        const completedDecks = eligibleDecks.filter(deck => getDeckTrialStars(deck) > 0).length
        const possibleStars = eligibleDecks.length * TRIAL_MAXIMUM_STARS

        return {
            completedDecks,
            eligibleDecks: eligibleDecks.length,
            completionPercentage: eligibleDecks.length === 0
                ? 0
                : Math.round(completedDecks * 100 / eligibleDecks.length),
            totalStars,
            possibleStars
        }
    }, [currentLanguage.code, decks])

    const otherLanguages = profileLanguages.filter(language => {
        return language.code !== currentLanguage.code
    })

    return (
        <div className="mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-[102rem] items-center justify-center py-8 sm:pt-14 min-[1400px]:pt-20">
            <div className="grid w-full max-w-[84rem] min-w-0 items-center justify-center gap-12 min-[1180px]:grid-cols-[minmax(30rem,1fr)_minmax(22rem,32rem)] min-[1180px]:gap-10 2xl:gap-16">
            <div className="min-w-0 self-start">
                <PerformanceTabs
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                />

                <LanguageDropdown
                    currentLanguage={currentLanguage}
                    otherLanguages={otherLanguages}
                    isOpen={languageMenuOpen}
                    onToggle={() => setLanguageMenuOpen(open => !open)}
                    onSelectLanguage={code => {
                        onSelectLanguage(code)
                        setLanguageMenuOpen(false)
                    }}
                />

                {activeTab === "General" && (
                    <GeneralPanel
                        performance={performance}
                        chartMode={chartMode}
                        historyLoading={historyLoading}
                        historyError={historyError}
                        onChartModeChange={setChartMode}
                    />
                )}

                {activeTab === "Rush Hour" && (
                    <RushHourPanel performance={performance} />
                )}

                {activeTab === "Trials" && (
                    <TrialsPanel progress={trialProgress} />
                )}
            </div>

            <div className="flex min-w-0 flex-col items-center justify-center justify-self-center min-[1180px]:justify-self-end">
                <GradeRing
                    rank={performance.rank}
                    accuracy={performance.averageAccuracy}
                    sizeClassName="h-[clamp(17rem,60vw,24rem)] w-[clamp(17rem,60vw,24rem)] min-[1180px]:h-[clamp(20rem,26vw,24rem)] min-[1180px]:w-[clamp(20rem,26vw,24rem)] 2xl:h-[clamp(22rem,30vw,32rem)] 2xl:w-[clamp(22rem,30vw,32rem)]"
                />

                <div className="mt-8 max-w-full text-center">
                    <p className="text-3xl text-white xl:text-4xl">Average Accuracy</p>
                    <p className="mt-4 text-5xl text-white xl:text-6xl">{performance.averageAccuracy}%</p>
                    <p className="mt-3 text-xl text-white/70">
                        {getNextRankText(performance.averageAccuracy)}
                    </p>
                </div>
            </div>
        </div>
        </div>
    )
}

function PerformanceTabs({
    activeTab,
    onSelectTab
}: {
    activeTab: PerformanceTab
    onSelectTab: (tab: PerformanceTab) => void
}) {
    const { palette } = useTheme()

    return (
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xl text-white/80 sm:gap-x-10 sm:text-3xl min-[1180px]:gap-x-14">
            {performanceTabs.map(tab => (
                <button
                    key={tab}
                    type="button"
                    onClick={() => onSelectTab(tab)}
                    className={`transition ${activeTab === tab ? palette.accentText : "hover:text-white"}`}
                >
                    {tab}
                </button>
            ))}
        </div>
    )
}

function LanguageDropdown({
    currentLanguage,
    otherLanguages,
    isOpen,
    onToggle,
    onSelectLanguage
}: {
    currentLanguage: ProfileComponentProps["currentLanguage"]
    otherLanguages: ProfileComponentProps["profileLanguages"]
    isOpen: boolean
    onToggle: () => void
    onSelectLanguage: (code: string) => void
}) {
    const { palette } = useTheme()

    return (
        <div className="relative mt-8 inline-block max-w-full sm:mt-12">
            <button
                type="button"
                onClick={onToggle}
                className={`inline-flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border-2 ${palette.border} bg-black/30 px-4 py-4 text-left sm:min-w-60 sm:gap-5 sm:px-6 sm:py-5 ${palette.glow}`}
            >
                <span className="flex items-center gap-4">
                    {currentLanguage.flagUrl && (
                        <img
                            src={currentLanguage.flagUrl}
                            alt={`${currentLanguage.label} flag`}
                            className="h-9 w-14 rounded-md object-cover"
                        />
                    )}

                    <span className="truncate text-xl font-bold text-white sm:text-3xl">
                        {currentLanguage.label}
                    </span>
                </span>

                <span className="text-lg text-white/80">⌄</span>
            </button>

            {isOpen && otherLanguages.length > 0 && (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 min-w-full overflow-hidden rounded-lg border border-white/20 bg-slate-950/95 shadow-2xl backdrop-blur">
                    {otherLanguages.map(language => (
                        <button
                            key={language.code}
                            type="button"
                            onClick={() => onSelectLanguage(language.code)}
                            className="flex w-full items-center gap-3 px-5 py-3 text-left text-xl font-bold text-white transition hover:bg-white/10"
                        >
                            {language.flagUrl && (
                                <img
                                    src={language.flagUrl}
                                    alt={`${language.label} flag`}
                                    className="h-7 w-10 rounded-md object-cover"
                                />
                            )}

                            {language.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function GeneralPanel({
    performance,
    chartMode,
    historyLoading,
    historyError,
    onChartModeChange
}: {
    performance: PerformanceSnapshot
    chartMode: ChartMode
    historyLoading: boolean
    historyError: string | null
    onChartModeChange: (mode: ChartMode) => void
}) {
    return (
        <>
            <div className="mt-10 grid w-full max-w-[44rem] grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-5">
                <PerformanceStat
                    label="Average response time"
                    value={`${performance.responseTime}s`}
                />

                <PerformanceStat
                    label="Highest combo"
                    value={`x${performance.highestCombo}`}
                />
            </div>

            {historyError && (
                <p className="mt-6 text-sm font-semibold text-red-200/80">
                    {historyError}
                </p>
            )}

            <RecentRunsChart
                accuracyValues={performance.recentAccuracyRuns}
                scoreValues={performance.recentScoreRuns}
                chartMode={chartMode}
                loading={historyLoading}
                onChartModeChange={onChartModeChange}
            />
        </>
    )
}

function RushHourPanel({ performance }: { performance: PerformanceSnapshot }) {
    return (
        <div className="mt-10 grid w-full max-w-[44rem] grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-5">
            <PerformanceStat
                label="Rush Hours triggered"
                value={performance.rushHoursTriggered.toString()}
            />

            <PerformanceStat
                label="Rush Hours completed"
                value={performance.rushHoursCompleted.toString()}
            />

            <PerformanceStat
                label="Longest Rush Hour duration"
                value={performance.longestRushHourDuration === null
                    ? "—"
                    : `${performance.longestRushHourDuration.toFixed(1)} seconds`}
            />
        </div>
    )
}

function TrialsPanel({ progress }: {
    progress: {
        completedDecks: number
        eligibleDecks: number
        completionPercentage: number
        totalStars: number
        possibleStars: number
    }
}) {
    const { t } = useI18n()

    return (
        <div className="mt-10 grid w-full max-w-[44rem] grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-5">
            <PerformanceStat
                label={t.trials.trialsCompleted}
                value={progress.completedDecks.toString()}
            />

            <PerformanceStat
                label={t.trials.eligibleDecks}
                value={progress.eligibleDecks.toString()}
            />

            <PerformanceStat
                label={t.trials.completionPercentage}
                value={`${progress.completionPercentage}%`}
            />

            <PerformanceStat
                label={t.trials.totalStars}
                value={progress.totalStars.toString()}
            />

            <PerformanceStat
                label={t.trials.starsEarned}
                value={`${progress.totalStars} / ${progress.possibleStars}`}
            />
        </div>
    )
}

function PerformanceStat({ label, value }: { label: string; value: string }) {
    const { palette } = useTheme()

    return (
        <div className={`min-w-0 rounded-lg border ${palette.border} ${palette.card} px-5 py-5 text-center sm:px-6 ${palette.glow}`}>
            <p className="text-lg leading-7 text-white sm:text-xl">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
    )
}

function RecentRunsChart({
    accuracyValues,
    scoreValues,
    chartMode,
    loading,
    onChartModeChange
}: {
    accuracyValues: number[]
    scoreValues: number[]
    chartMode: ChartMode
    loading: boolean
    onChartModeChange: (mode: ChartMode) => void
}) {
    const { theme } = useTheme()
    const [barsVisible, setBarsVisible] = useState(false)
    const chartLabel = chartMode === "accuracy" ? "Accuracy" : "Score"
    const sourceValues = chartMode === "accuracy" ? accuracyValues : scoreValues
    const values = getChartValues(sourceValues, chartMode)
    const barPalette = getRingPalette(theme.paletteId)

    useEffect(() => {
        setBarsVisible(false)

        const frame = window.requestAnimationFrame(() => {
            setBarsVisible(true)
        })

        return () => window.cancelAnimationFrame(frame)
    }, [chartMode, sourceValues])

    return (
        <div className="mt-16">
            <h2 className="text-2xl font-black text-white sm:text-3xl">10 Most Recent Runs</h2>

            <div className="mt-8 max-w-[50rem]">
                <div className="relative h-64 border-b-2 border-l-2 border-white/80 pl-3 sm:h-72 sm:pl-6">
                    <span className="absolute left-2 top-2 text-xs text-white/75 sm:text-sm">
                        Result
                    </span>

                    <span className="absolute -bottom-7 right-0 text-sm text-white/75">
                        Runs
                    </span>

                    {loading && (
                        <div className="grid h-full place-items-center text-sm font-semibold text-white/60">
                            Loading runs...
                        </div>
                    )}

                    {!loading && values.length === 0 && (
                        <div className="grid h-full place-items-center text-sm font-semibold text-white/60">
                            No runs yet
                        </div>
                    )}

                    {!loading && values.length > 0 && (
                        <div className="flex h-full items-end justify-around gap-1 sm:gap-3">
                            {values.map((value, index) => {
                                const exactValue = sourceValues[index]
                                const displayValue = chartMode === "accuracy"
                                    ? `${Math.round(exactValue)}%`
                                    : Math.round(exactValue).toLocaleString()
                                const ariaLabel = `${chartLabel}: ${displayValue}`

                                return (
                                    <div
                                        key={`${chartMode}-${exactValue}-${index}`}
                                        className="group relative flex h-full min-w-0 flex-1 items-end justify-center"
                                        tabIndex={0}
                                        role="img"
                                        aria-label={ariaLabel}
                                    >
                                        <div
                                            className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-md border border-white/15 bg-slate-950/95 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white opacity-0 shadow-xl transition duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                                            style={{ bottom: `calc(${value}% + 0.75rem)` }}
                                        >
                                            {chartLabel}: {displayValue}
                                        </div>

                                        <div
                                            className="w-4 origin-bottom rounded-t-sm shadow-lg transition-[transform,filter] duration-500 ease-out group-hover:brightness-125 group-focus-visible:brightness-125 sm:w-7"
                                            style={{
                                                height: `${value}%`,
                                                transform: barsVisible ? "scaleY(1)" : "scaleY(0)",
                                                background: `linear-gradient(to top, ${barPalette.from}, ${barPalette.to})`,
                                                transitionDelay: `${index * 45}ms`
                                            }}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-9 flex flex-wrap justify-center gap-4 text-base text-white/80 sm:gap-16 sm:text-lg">
                    <ChartModeButton
                        label="Accuracy"
                        active={chartMode === "accuracy"}
                        onClick={() => onChartModeChange("accuracy")}
                    />

                    <ChartModeButton
                        label="Score"
                        active={chartMode === "score"}
                        onClick={() => onChartModeChange("score")}
                    />
                </div>
            </div>
        </div>
    )
}

function ChartModeButton({
    label,
    active,
    onClick
}: {
    label: string
    active: boolean
    onClick: () => void
}) {
    const { palette } = useTheme()

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full border px-5 py-1 text-sm transition ${active ? `${palette.border} ${palette.accentText}` : "border-transparent hover:text-white"}`}
        >
            {label}
        </button>
    )
}

function getPerformanceSnapshot(runs: GameRunHistory[]): PerformanceSnapshot {
    const totalAnswers = runs.reduce((sum, run) => sum + run.totalAnswers, 0)
    const totalCorrectAnswers = runs.reduce((sum, run) => sum + run.correctAnswers, 0)
    const averageAccuracy = totalAnswers === 0
        ? 0
        : Math.round(clamp(totalCorrectAnswers * 100 / totalAnswers, 0, 100))

    const completedRuns = [...runs].reverse()
    const responseTimes = runs
        .map(run => run.averageResponseTimeSeconds)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value))

    const averageResponseTime = responseTimes.length === 0
        ? "0.0"
        : (responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length).toFixed(1)

    return {
        averageAccuracy,
        rank: getRankFromAccuracy(averageAccuracy),
        responseTime: averageResponseTime,
        highestCombo: Math.max(0, ...runs.map(run => run.highestCombo)),
        recentAccuracyRuns: completedRuns.map(run => Math.round(clamp(run.accuracyPercent, 0, 100))),
        recentScoreRuns: completedRuns.map(run => run.finalScore),
        rushHoursTriggered: runs.reduce((sum, run) => sum + (run.rushHoursTriggered ?? 0), 0),
        rushHoursCompleted: runs.reduce((sum, run) => sum + (run.rushHoursCompleted ?? 0), 0),
        longestRushHourDuration: getLongestRushHourDuration(runs)
    }
}

function getLongestRushHourDuration(runs: GameRunHistory[]) {
    const durations = runs
        .map(run => run.longestRushHourDurationSeconds)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value))

    return durations.length === 0 ? null : Math.max(...durations)
}

function getChartValues(values: number[], chartMode: ChartMode) {
    if (chartMode === "accuracy") return values.map(value => clamp(value, 0, 100))

    const maxValue = Math.max(...values, 0)
    if (maxValue === 0) return values.map(() => 0)

    return values.map(value => clamp((value / maxValue) * 100, 4, 100))
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}
