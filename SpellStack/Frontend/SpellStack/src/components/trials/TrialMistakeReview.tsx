import { forwardRef } from "react"
import { ArrowLeft } from "lucide-react"

import type { DeckTrialAnswer } from "../../hooks/useDeckTrialSession"
import { useI18n } from "../../i18n/I18nContext"
import { useTheme } from "../../theme/ThemeContext"

interface TrialMistakeReviewProps {
    mistakes: DeckTrialAnswer[]
    totalQuestions: number
    onBack: () => void
}

const TrialMistakeReview = forwardRef<HTMLHeadingElement, TrialMistakeReviewProps>(function TrialMistakeReview({
    mistakes,
    totalQuestions,
    onBack
}, headingRef) {
    const { t } = useI18n()
    const { palette } = useTheme()

    return (
        <div className="mx-auto min-h-dvh w-full max-w-[92rem] px-4 py-6 text-white sm:px-8 lg:px-12">
            <header className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-black/30 px-4 py-2 font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label={t.trials.backToResults}
                >
                    <ArrowLeft size={19} /> {t.trials.backToResults}
                </button>
                <h1 ref={headingRef} tabIndex={-1} className="text-center text-[clamp(1.75rem,2vw,3.25rem)] font-black outline-none sm:col-start-2">
                    {t.trials.incorrectSummary
                        .replace("{incorrect}", String(mistakes.length))
                        .replace("{total}", String(totalQuestions))}
                </h1>
            </header>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {mistakes.map((record, index) => (
                    <article
                        key={`${record.question.wordId}-${record.question.direction}-${index}`}
                        className={`min-w-0 rounded-2xl border ${palette.border} ${palette.card} ${palette.glow} p-6 shadow-2xl sm:p-8 xl:p-9`}
                    >
                        <ReviewSection label={t.trials.word} value={record.question.prompt} />
                        <ReviewSection label={t.trials.correctAnswer} value={record.question.correctAnswer} valueClassName="text-emerald-300" separator />
                        {record.question.acceptedAnswers.length > 0 && (
                            <p className="-mt-2 mb-6 break-words text-base text-white/55 sm:text-lg">
                                {t.trials.acceptedAlternatives}: {record.question.acceptedAnswers.join(", ")}
                            </p>
                        )}
                        <ReviewSection label={t.trials.yourAnswer} value={record.submittedAnswer || t.trials.noAnswer} valueClassName="text-red-300" separator />
                    </article>
                ))}
            </div>
        </div>
    )
})

function ReviewSection({
    label,
    value,
    separator = false,
    valueClassName = "text-white"
}: {
    label: string
    value: string
    separator?: boolean
    valueClassName?: string
}) {
    return (
        <section className={`${separator ? "border-t border-white/20 pt-6" : ""} mb-6 last:mb-0`}>
            <h2 className="text-[clamp(1.25rem,1.4vw,2.25rem)] font-bold text-white/70">{label}</h2>
            <p className={`mt-4 break-words text-center text-[clamp(2.5rem,3.75vw,6rem)] font-black leading-tight [overflow-wrap:anywhere] ${valueClassName}`}>{value}</p>
        </section>
    )
}

export default TrialMistakeReview
