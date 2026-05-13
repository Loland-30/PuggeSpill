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

interface RunResultScreenProps {
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

export default function RunResultScreen({
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
}: RunResultScreenProps) {
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
                    <RunResultStat
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

function RunResultStat({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-lg bg-white p-4 text-center shadow-sm">
            <p className="text-xs uppercase tracking-widest text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    )
}
