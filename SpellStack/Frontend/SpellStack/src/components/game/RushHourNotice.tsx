import { memo } from "react"
interface RushHourNoticeProps {
    active: boolean
    bonusFlash: boolean
    answers: number
}

function RushHourNotice({ active, bonusFlash, answers }: RushHourNoticeProps) {
    if (!active && !bonusFlash) return null

    return (
        <div className="mx-auto mt-8 w-full max-w-3xl rounded-2xl border border-yellow-300/40 bg-yellow-300/10 px-5 py-3 text-center shadow-[0_0_28px_rgba(250,204,21,0.2)]">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-yellow-200">
                {bonusFlash ? "Rush cleared x2.5" : "Rush Hour"}
            </p>
            <p className="mt-1 text-sm font-semibold text-white/55">
                Fill the timer for x2.5 on this rush - Hits: {answers}
            </p>
        </div>
    )
}

export default memo(RushHourNotice)
