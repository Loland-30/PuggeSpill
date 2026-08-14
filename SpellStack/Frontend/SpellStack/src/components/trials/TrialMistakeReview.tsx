import { forwardRef } from "react"
import { ArrowLeft } from "lucide-react"

import type { DeckTrialAnswer } from "../../hooks/useDeckTrialSession"
import { useI18n } from "../../i18n/I18nContext"
import { useTheme } from "../../theme/ThemeContext"
import AutoFitText from "../AutoFitText"

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
                    className={`group inline-flex h-12 w-12 shrink-0 items-center justify-center gap-0 overflow-hidden rounded-full shadow-lg transition-[width,gap,transform,box-shadow] duration-300 ease-out hover:w-52 hover:gap-2.5 focus-visible:w-52 focus-visible:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}`}
                    aria-label={t.trials.backToResults}
                >
                    <ArrowLeft size={21} strokeWidth={2.7} className="shrink-0" />
                    <span className="ml-0 max-w-0 translate-x-1 overflow-hidden whitespace-nowrap text-sm font-black opacity-0 transition-[max-width,opacity,transform] duration-300 ease-out group-hover:max-w-40 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:max-w-40 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                        {t.trials.backToResults}
                    </span>
                </button>
                <h1 ref={headingRef} tabIndex={-1} className="text-center text-[clamp(1.5rem,1.8vw,2.5rem)] font-black outline-none sm:col-start-2">
                    {t.trials.incorrectSummary
                        .replace("{incorrect}", String(mistakes.length))
                        .replace("{total}", String(totalQuestions))}
                </h1>
            </header>

            <div className={`mx-auto mt-10 grid w-full grid-cols-1 gap-5 md:gap-7 ${mistakes.length > 1 ? "max-w-[78rem] md:grid-cols-2" : "max-w-[38rem]"}`}>
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
            <h2 className="text-[clamp(1.125rem,1.2vw,1.5rem)] font-bold text-white/70">{label}</h2>
            <AutoFitText
                text={value}
                className={`mt-4 text-center font-black ${valueClassName}`}
                maxFontSize="clamp(2rem, 3vw, 4.5rem)"
            />
        </section>
    )
}

export default TrialMistakeReview
