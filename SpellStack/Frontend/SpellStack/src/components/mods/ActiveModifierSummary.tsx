import type { ActiveGameModifier } from "../../api/gameSession"
import { useTheme } from "../../theme/ThemeContext"
import {
    formatScoreMultiplier,
    getModifierNames,
    getModifierScoreMultiplier
} from "./modifierUtils"

interface Props {
    modifiers: ActiveGameModifier[]
}

export default function ActiveModifiersSummary({ modifiers }: Props) {
    const { palette } = useTheme()
    const scoreMultiplier = getModifierScoreMultiplier(modifiers)

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                    Active mods
                </p>

                <p className="mt-2 text-base font-bold text-white">
                    {getModifierNames(modifiers)}
                </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 px-6 py-4 text-center shadow-xl">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                    Score
                </p>

                <p className={`mt-1 text-2xl font-black ${scoreMultiplier === 0 ? "text-white/60" : palette.accentText}`}>
                    {formatScoreMultiplier(scoreMultiplier)}
                </p>
            </div>
        </div>
    )
}
