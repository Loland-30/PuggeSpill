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
        <header className="pointer-events-none relative z-40 flex w-full items-start justify-between gap-2 sm:gap-4">
            <div className="flex min-w-0 flex-col items-start gap-1.5 sm:gap-3">
                <LivesDisplay lives={lives} maxLives={maxLives} size="large" />

                <p className="max-w-40 truncate text-[0.65rem] font-black uppercase tracking-[0.14em] text-white/50 sm:max-w-72 sm:text-xs sm:tracking-[0.22em]">
                    {stageLabel}
                </p>
                {modifierLabel && (
                    <p className="max-w-40 truncate text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/45 sm:max-w-72 sm:text-xs sm:tracking-[0.22em]">
                        {modifierLabel}
                    </p>
                )}
            </div>

            <div className="flex flex-col items-end text-right">
                <p className="max-w-[11rem] truncate text-lg font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:max-w-none sm:text-4xl">
                    Score: {score}
                </p>

                <div className="mt-1 flex min-h-14 flex-col items-end gap-0.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white/50 sm:mt-3 sm:min-h-20 sm:gap-1 sm:text-sm sm:tracking-[0.2em]">
                    {scoreDelta !== null && scoreDelta > 0 && (
                        <span className="text-xl font-black tracking-tight text-green-400 sm:text-4xl">
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
