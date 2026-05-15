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
        <header className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-4">
            <div className="flex flex-col items-start gap-3">

                <LivesDisplay lives={lives} maxLives={maxLives} size="large" />
            </div>

            <div className="min-w-0 px-4 text-center">
                <p className="truncate text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {stageLabel}
                </p>
                {modifierLabel && (
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.28em] text-white/45">
                        {modifierLabel}
                    </p>
                )}
            </div>

            <div className="flex flex-col items-end text-right">
                <p className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                    Score: {score}
                </p>

                <div className="mt-3 flex min-h-20 flex-col items-end gap-1 text-sm font-bold uppercase tracking-[0.2em] text-white/45">
                    {scoreDelta !== null && scoreDelta > 0 && (
                        <span className="text-4xl font-black tracking-tight text-green-400 sm:text-5xl">
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
