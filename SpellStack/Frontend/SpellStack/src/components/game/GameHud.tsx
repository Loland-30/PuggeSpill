import { memo } from "react"
import LivesDisplay from "../LivesDisplay"

interface GameHudProps {
    lives: number
    maxLives: number
    showLives?: boolean
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
    showLives = true,
    stageLabel,
    score,
    scoreDelta,
    modifierLabel,
    accuracy,
    streak,
    rushActive
}: GameHudProps) {
    return (
        <header className="pointer-events-none relative z-40 flex w-full flex-col items-center gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:items-start sm:gap-3 sm:text-left">
                {showLives && <LivesDisplay lives={lives} maxLives={maxLives} size="large" />}

                <p className="max-w-[90vw] truncate text-sm font-black uppercase tracking-[0.12em] text-white/70 sm:max-w-72 sm:text-xs sm:tracking-[0.22em] sm:text-white/50">
                    {stageLabel}
                </p>
                {modifierLabel && (
                    <p className="max-w-[90vw] truncate text-xs font-bold uppercase tracking-[0.12em] text-white/55 sm:max-w-72 sm:tracking-[0.22em] sm:text-white/45">
                        {modifierLabel}
                    </p>
                )}
            </div>

            <div className="hidden flex-col items-end text-right sm:flex">
                <p className="max-w-none truncate text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
                    Score: {score}
                </p>

                <div className="mt-3 flex min-h-20 flex-col items-end gap-1 text-sm font-bold uppercase tracking-[0.2em] text-white/50">
                    {scoreDelta !== null && scoreDelta > 0 && (
                        <span className="text-4xl font-black tracking-tight text-green-400">
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
