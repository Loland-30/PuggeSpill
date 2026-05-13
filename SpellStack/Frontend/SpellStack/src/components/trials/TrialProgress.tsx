interface TrialProgressProps {
    current: number
    total: number
}

export default function TrialProgress({ current, total }: TrialProgressProps) {
    const progress = total === 0 ? 0 : (current / total) * 100

    return (
        <div className="w-full">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.25em] text-gray-400">
                <span>Trial</span>
                <span>{current} / {total}</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                    className="h-full rounded-full bg-orange-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    )
}
