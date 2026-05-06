import { useEffect, useMemo, useState } from "react"
import { useTheme } from "../../theme/ThemeContext"
import type { PaletteThemeId } from "../../theme/themes"
import type { ProfileComponentProps } from "./types"

const performanceTabs = ["General", "Rush Hour", "Trials"] as const
type PerformanceTab = typeof performanceTabs[number]

const chartModes = ["accuracy", "score"] as const
type ChartMode = typeof chartModes[number]

const rankThresholds = [
    { label: "D", minAccuracy: 0 },
    { label: "C", minAccuracy: 45 },
    { label: "B", minAccuracy: 65 },
    { label: "A", minAccuracy: 80 },
    { label: "S", minAccuracy: 90 }
] as const

const visibleRankMarkers = rankThresholds.filter(rank => rank.label !== "D")

type RankLabel = typeof rankThresholds[number]["label"]

interface PerformanceSnapshot {
    averageAccuracy: number
    rank: RankLabel
    responseTime: string
    highestMultiplier: number
    recentRuns: number[]
    rushHoursTriggered: number
    longestRushHourDuration: number
    trialsAttempted: number
    averageTrialWinRate: number
    recentTrialScore: number
    bestTrialScore: number
}

export default function PerformancePage({
    profileLanguages,
    currentLanguage,
    onSelectLanguage
}: ProfileComponentProps) {
    const { theme } = useTheme()

    const [activeTab, setActiveTab] = useState<PerformanceTab>("General")
    const [chartMode, setChartMode] = useState<ChartMode>("accuracy")
    const [languageMenuOpen, setLanguageMenuOpen] = useState(false)

    const performance = useMemo(() => {
        return getPerformanceSnapshot(currentLanguage.stats)
    }, [currentLanguage.stats])

    const otherLanguages = profileLanguages.filter(language => {
        return language.code !== currentLanguage.code
    })

    return (
        <div className="mx-auto grid min-h-[calc(100vh-12rem)] w-full max-w-[102rem] items-start gap-10 pt-20 lg:grid-cols-[minmax(0,52rem)_minmax(26rem,34rem)] xl:gap-16">
            <div className="self-start">
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
                        onChartModeChange={setChartMode}
                    />
                )}

                {activeTab === "Rush Hour" && (
                    <RushHourPanel performance={performance} />
                )}

                {activeTab === "Trials" && (
                    <TrialsPanel performance={performance} />
                )}
            </div>

            <div className="flex min-w-0 flex-col items-center justify-center justify-self-center lg:justify-self-end">
                <RankRing
                    rank={performance.rank}
                    accuracy={performance.averageAccuracy}
                    paletteId={theme.paletteId}
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
        <div className="flex flex-wrap gap-14 text-3xl text-white/80">
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
        <div className="relative mt-12 inline-block">
            <button
                type="button"
                onClick={onToggle}
                className={`inline-flex min-w-60 items-center justify-between gap-5 rounded-lg border-2 ${palette.border} bg-black/30 px-6 py-5 text-left ${palette.glow}`}
            >
                <span className="flex items-center gap-4">
                    {currentLanguage.flagUrl && (
                        <img
                            src={currentLanguage.flagUrl}
                            alt={`${currentLanguage.label} flag`}
                            className="h-9 w-14 rounded-md object-cover"
                        />
                    )}

                    <span className="text-3xl font-bold text-white">
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
    onChartModeChange
}: {
    performance: PerformanceSnapshot
    chartMode: ChartMode
    onChartModeChange: (mode: ChartMode) => void
}) {
    return (
        <>
            <div className="mt-10 grid max-w-[44rem] gap-5 sm:grid-cols-2">
                <PerformanceStat
                    label="Average response time"
                    value={`${performance.responseTime}s`}
                />

                <PerformanceStat
                    label="Highest score multiplier"
                    value={performance.highestMultiplier.toString()}
                />
            </div>

            <RecentRunsChart
                values={performance.recentRuns}
                chartMode={chartMode}
                onChartModeChange={onChartModeChange}
            />
        </>
    )
}

function RushHourPanel({ performance }: { performance: PerformanceSnapshot }) {
    return (
        <div className="mt-10 grid max-w-[44rem] gap-5 sm:grid-cols-2">
            <PerformanceStat
                label="Rush Hours triggered"
                value={performance.rushHoursTriggered.toString()}
            />

            <PerformanceStat
                label="Longest Rush Hour duration"
                value={`${performance.longestRushHourDuration} seconds`}
            />
        </div>
    )
}

function TrialsPanel({ performance }: { performance: PerformanceSnapshot }) {
    return (
        <div className="mt-10 grid max-w-[44rem] gap-5 sm:grid-cols-2">
            <PerformanceStat
                label="Trials attempted"
                value={performance.trialsAttempted.toString()}
            />

            <PerformanceStat
                label="Average Trial win rate"
                value={`${performance.averageTrialWinRate}%`}
            />

            <PerformanceStat
                label="Recent Trial"
                value={`${performance.recentTrialScore}%`}
            />

            <PerformanceStat
                label="Best Trial"
                value={`${performance.bestTrialScore}%`}
            />
        </div>
    )
}

function PerformanceStat({ label, value }: { label: string; value: string }) {
    const { palette } = useTheme()

    return (
        <div className={`rounded-lg border ${palette.border} ${palette.card} px-6 py-5 text-center ${palette.glow}`}>
            <p className="text-xl text-white">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
    )
}

function RecentRunsChart({
    values,
    chartMode,
    onChartModeChange
}: {
    values: number[]
    chartMode: ChartMode
    onChartModeChange: (mode: ChartMode) => void
}) {
    const { palette } = useTheme()
    const chartLabel = chartMode === "accuracy" ? "Accuracy" : "Score"

    return (
        <div className="mt-16">
            <h2 className="text-3xl font-black text-white">10 Most Recent Runs</h2>

            <div className="mt-8 max-w-[50rem]">
                <div className="relative h-72 border-b-2 border-l-2 border-white/80 pl-6">
                    <span className="absolute -left-14 top-0 text-sm text-white/75">
                        Result
                    </span>

                    <span className="absolute -bottom-7 right-0 text-sm text-white/75">
                        Runs
                    </span>

                    <div className="flex h-full items-end gap-7">
                        {values.map((value, index) => (
                            <div
                                key={`${chartMode}-${value}-${index}`}
                                title={`${chartLabel}: ${Math.round(value)}${chartMode === "accuracy" ? "%" : ""}`}
                                className={`w-7 rounded-t-sm transition ${palette.preview}`}
                                style={{ height: `${value}%` }}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-9 flex justify-center gap-16 text-lg text-white/80">
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

function RankRing({
    rank,
    accuracy,
    paletteId
}: {
    rank: RankLabel
    accuracy: number
    paletteId: PaletteThemeId
}) {
    const [animatedAccuracy, setAnimatedAccuracy] = useState(0)

    const ring = getRingPalette(paletteId)
    const radius = 142
    const circumference = 2 * Math.PI * radius
    const progress = circumference * (animatedAccuracy / 100)

    useEffect(() => {
        setAnimatedAccuracy(0)

        const frame = window.requestAnimationFrame(() => {
            setAnimatedAccuracy(accuracy)
        })

        return () => window.cancelAnimationFrame(frame)
    }, [accuracy, paletteId])

    return (
        <div className="relative grid h-[clamp(22rem,30vw,32rem)] w-[clamp(22rem,30vw,32rem)] place-items-center">
            <svg
                viewBox="0 0 360 360"
                className="absolute inset-0 h-full w-full -rotate-90"
            >
                <defs>
                    <linearGradient
                        id={`rank-ring-${paletteId}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor={ring.from} />
                        <stop offset="100%" stopColor={ring.to} />
                    </linearGradient>
                </defs>

                <circle
                    cx="180"
                    cy="180"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="18"
                />

                <circle
                    cx="180"
                    cy="180"
                    r={radius}
                    fill="none"
                    stroke={`url(#rank-ring-${paletteId})`}
                    strokeLinecap="round"
                    strokeWidth="18"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    style={{ transition: "stroke-dashoffset 900ms ease-out" }}
                />

                {visibleRankMarkers.map(threshold => (
                    <RankTick
                        key={threshold.label}
                        accuracy={threshold.minAccuracy}
                    />
                ))}
            </svg>

            <div className="pointer-events-none absolute inset-0">
                {visibleRankMarkers.map(threshold => (
                    <RankLabelMarker
                        key={threshold.label}
                        label={threshold.label}
                        accuracy={threshold.minAccuracy}
                        active={threshold.label === rank}
                    />
                ))}
            </div>

            <p className="text-9xl font-black text-white">
                {rank}
            </p>
        </div>
    )
}

function RankTick({ accuracy }: { accuracy: number }) {
    const start = polarToSvgPoint(180, 180, 153, accuracy)
    const end = polarToSvgPoint(180, 180, 170, accuracy)

    return (
        <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
        />
    )
}

function RankLabelMarker({
    label,
    accuracy,
    active
}: {
    label: RankLabel
    accuracy: number
    active: boolean
}) {
    return (
        <span
            className={`absolute text-3xl transition ${active ? "font-black text-white" : "text-white/75"}`}
            style={getRankLabelPosition(accuracy)}
        >
            {label}
        </span>
    )
}

function getRankLabelPosition(accuracy: number) {
    const center = 50
    const radius = 55
    const angleRadians = getAccuracyAngleRadians(accuracy)

    const x = center + radius * Math.cos(angleRadians)
    const y = center + radius * Math.sin(angleRadians)

    return {
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)"
    }
}

function polarToSvgPoint(centerX: number, centerY: number, radius: number, accuracy: number) {
    const angleRadians = getAccuracyAngleRadians(accuracy)

    return {
        x: centerX + radius * Math.cos(angleRadians),
        y: centerY + radius * Math.sin(angleRadians)
    }
}

function getAccuracyAngleRadians(accuracy: number) {
    const clampedAccuracy = clamp(accuracy, 0, 100)
    const angleDegrees = clampedAccuracy * 3.6 - 90

    return angleDegrees * (Math.PI / 180)
}

function getNextRankText(accuracy: number) {
    const nextRank = rankThresholds.find(threshold => {
        return accuracy < threshold.minAccuracy
    })

    if (!nextRank) return "Top rank reached"

    const difference = Math.ceil(nextRank.minAccuracy - accuracy)

    return `${difference}% to ${nextRank.label}`
}

function getRankFromAccuracy(accuracy: number): RankLabel {
    const reversedThresholds = [...rankThresholds].reverse()

    return reversedThresholds.find(threshold => {
        return accuracy >= threshold.minAccuracy
    })?.label ?? "D"
}

function getRingPalette(paletteId: PaletteThemeId) {
    const ringPalettes: Record<PaletteThemeId, { from: string; to: string }> = {
        blue: { from: "#38bdf8", to: "#0ea5e9" },
        pink: { from: "#f472b6", to: "#ec4899" },
        green: { from: "#34d399", to: "#10b981" },
        red: { from: "#f87171", to: "#ef4444" },
        yellow: { from: "#fcb103", to: "#f5c542" },
        purpleGradient: { from: "#f43f5e", to: "#7c3aed" },
        mangoPop: { from: "#ff0f7b", to: "#f89b29" },
        frostByte: { from: "#0061ff", to: "#60efff" }
    }

    return ringPalettes[paletteId]
}

function getPerformanceSnapshot(stats: {
    runsPlayed: number
    longestStreak: number
    wordsLearned: number
}): PerformanceSnapshot {
    const averageAccuracy = getMockAverageAccuracy(stats)

    return {
        averageAccuracy,
        rank: getRankFromAccuracy(averageAccuracy),
        responseTime: getMockResponseTime(stats),
        highestMultiplier: getMockHighestMultiplier(stats),
        recentRuns: getMockRecentRuns(stats, averageAccuracy),
        rushHoursTriggered: getMockRushHoursTriggered(stats),
        longestRushHourDuration: getMockLongestRushHourDuration(stats),
        trialsAttempted: getMockTrialsAttempted(stats),
        averageTrialWinRate: getMockAverageTrialWinRate(stats),
        recentTrialScore: getMockRecentTrialScore(stats),
        bestTrialScore: getMockBestTrialScore(stats)
    }
}

function getMockAverageAccuracy(stats: {
    runsPlayed: number
    longestStreak: number
    wordsLearned: number
}) {
    if (stats.runsPlayed === 0) return 0

    return Math.round(
        clamp(
            62 + stats.longestStreak * 3 + Math.min(stats.wordsLearned, 20),
            0,
            98
        )
    )
}

function getMockResponseTime(stats: {
    runsPlayed: number
    longestStreak: number
}) {
    if (stats.runsPlayed === 0) return "0.0"

    return Math.max(0.8, 2.4 - stats.longestStreak * 0.08).toFixed(1)
}

function getMockHighestMultiplier(stats: { longestStreak: number }) {
    return Math.max(1, Math.round(stats.longestStreak * 3.25))
}

function getMockRecentRuns(
    stats: {
        runsPlayed: number
        longestStreak: number
        wordsLearned: number
    },
    averageAccuracy: number
) {
    const seed = Math.max(1, stats.wordsLearned + stats.longestStreak + stats.runsPlayed)

    return Array.from({ length: 10 }, (_, index) => {
        const wave = Math.sin((seed + index) * 1.7) * 18
        const value = averageAccuracy + wave - 8 + index * 1.5

        return Math.round(clamp(value, 28, 96))
    })
}

function getMockRushHoursTriggered(stats: {
    runsPlayed: number
    longestStreak: number
}) {
    return Math.max(0, Math.round(stats.runsPlayed * 0.35 + stats.longestStreak * 0.4))
}

function getMockLongestRushHourDuration(stats: {
    longestStreak: number
}) {
    return Math.max(0, Math.round(4 + stats.longestStreak * 0.75))
}

function getMockTrialsAttempted(stats: {
    runsPlayed: number
}) {
    return Math.max(0, Math.round(stats.runsPlayed * 0.25))
}

function getMockAverageTrialWinRate(stats: {
    runsPlayed: number
    longestStreak: number
}) {
    if (stats.runsPlayed === 0) return 0

    return Math.round(clamp(35 + stats.longestStreak * 2.2, 0, 95))
}

function getMockRecentTrialScore(stats: {
    longestStreak: number
    wordsLearned: number
}) {
    return Math.round(clamp(50 + stats.longestStreak * 1.5 + stats.wordsLearned * 0.15, 0, 98))
}

function getMockBestTrialScore(stats: {
    longestStreak: number
    wordsLearned: number
}) {
    return Math.round(clamp(65 + stats.longestStreak * 2 + stats.wordsLearned * 0.2, 0, 99))
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}
