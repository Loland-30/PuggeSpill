import { LockKeyhole } from "lucide-react"

import { useI18n } from "../../i18n/I18nContext"
import type { PaletteTheme } from "../../theme/themes"

interface DeckTrialLockedOverlayProps {
    wordsRemaining: number
    palette: PaletteTheme
}

export default function DeckTrialLockedOverlay({ wordsRemaining, palette }: DeckTrialLockedOverlayProps) {
    const { t } = useI18n()
    const progressText = wordsRemaining === 1
        ? t.trials.oneMoreWordToGo
        : t.trials.moreWordsToGo.replace("{count}", String(wordsRemaining))

    return (
        <div className="absolute inset-[2px] z-20 flex cursor-not-allowed flex-col items-center justify-center rounded-[inherit] bg-slate-950/80 px-4 text-center">
            <LockKeyhole className={palette.accentText} size={25} strokeWidth={2.5} aria-hidden="true" />
            <p className={`mt-2 text-lg font-black ${palette.accentText}`}>{t.trials.locked}</p>
            <p className="mt-1 text-sm font-semibold text-white/75">{progressText}</p>
        </div>
    )
}
