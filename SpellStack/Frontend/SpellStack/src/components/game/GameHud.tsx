import { memo } from "react"
import LivesDisplay from "../LivesDisplay"

interface GameHudProps {
    lives: number
    maxLives: number
    stageLabel: string
    score: number
    scoreDelta: number | null
    modifierLabel?: string
    accuracy: number
    streak: number
    rushActive: boolean
}

function GameHud({
    lives,
    maxLives,
    stageLabel,
    score,
    scoreDelta,
    modifierLabel,
    accuracy,
    streak,
    rushActive
}: GameHudProps) {
    return (
        <header className="pointer-events-none relative z-40 flex w-full items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col items-start gap-3">
                <LivesDisplay lives={lives} maxLives={maxLives} size="large" />

                <p className="max-w-72 truncate text-xs font-black uppercase tracking-[0.22em] text-white/50">
                    {stageLabel}
                </p>
                {modifierLabel && (
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
                        {modifierLabel}
                    </p>
                )}
            </div>

            <div className="flex flex-col items-end text-right">
                <p className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-4xl">
                    Score: {score}
                </p>

                <div className="mt-3 flex min-h-20 flex-col items-end gap-1 text-sm font-bold uppercase tracking-[0.2em] text-white/50">
                    {scoreDelta !== null && scoreDelta > 0 && (
                        <span className="text-3xl font-black tracking-tight text-green-400 sm:text-4xl">
                            +{scoreDelta}
                        </span>
                    )}
                    <span>{rushActive ? "Rush Hour" : `Accuracy ${accuracy}%`}</span>
                    <span className="text-orange-300">Combo x{streak}</span>
                </div>
            </div>
        </header>
    )
}

export default memo(GameHud)
