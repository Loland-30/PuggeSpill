import type { FormEvent } from "react"

import { useI18n } from "../../i18n/I18nContext"
import { useTheme } from "../../theme/ThemeContext"

interface TrialQuestionCardProps {
    title: string
    source: string
    answer: string
    onAnswerChange: (value: string) => void
    onSubmit: () => void
}

export default function TrialQuestionCard({ title, source, answer, onAnswerChange, onSubmit }: TrialQuestionCardProps) {
    const { t } = useI18n()
    const { palette } = useTheme()

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        onSubmit()
    }

    return (
        <form onSubmit={handleSubmit} className={`w-full rounded-2xl border ${palette.border} ${palette.card} ${palette.glow} p-4 text-center shadow-2xl sm:rounded-3xl sm:p-8`}>
            <p className={`text-xs font-black uppercase tracking-[0.3em] ${palette.accentText}`}>{title}</p>
            <h1 className="mt-5 break-words text-4xl font-black text-white sm:mt-6 sm:text-6xl">{source}</h1>
            <input
                type="text"
                value={answer}
                onChange={event => onAnswerChange(event.target.value)}
                autoFocus
                placeholder={t.trials.answerPlaceholder}
                className={`mt-10 w-full border-b-2 ${palette.border} bg-transparent py-4 text-center text-2xl font-semibold text-white outline-none transition focus:border-white placeholder:text-white/30`}
            />
            <button type="submit" className={`mt-8 rounded-full px-10 py-3 font-bold shadow-lg transition ${palette.primaryButton} ${palette.primaryButtonText}`}>
                {t.trials.next}
            </button>
        </form>
    )
}
