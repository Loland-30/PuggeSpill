import { useI18n } from "../../i18n/I18nContext"
import { useTheme } from "../../theme/ThemeContext"

interface TrialProgressProps {
    current: number
    total: number
}

export default function TrialProgress({ current, total }: TrialProgressProps) {
    const { t } = useI18n()
    const { palette } = useTheme()
    const progress = total === 0 ? 0 : (current / total) * 100

    return (
        <div className="w-full">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.25em] text-white/55">
                <span>{t.common.trials}</span>
                <span>{current} / {total}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${palette.primaryButton}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    )
}
