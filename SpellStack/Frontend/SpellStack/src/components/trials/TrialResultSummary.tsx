import { forwardRef } from "react"
import { ArrowLeft, RefreshCw } from "lucide-react"

import type { Deck, TrialResult, TrialStarRequirement } from "../../api/decks"
import { languages } from "../../data/languages"
import { useI18n } from "../../i18n/I18nContext"
import { useTheme } from "../../theme/ThemeContext"
import TrialResultRing from "./TrialResultRing"

interface TrialResultSummaryProps {
    deck: Deck
    correctAnswers: number
    totalQuestions: number
    percentage: number
    requirements: TrialStarRequirement[]
    savedResult: TrialResult | null
    resultError: string
    isSavingResult: boolean
    mistakeCount: number
    animateResult: boolean
    onResultAnimationComplete: () => void
    onReview: () => void
    onRetrySave: () => void
    onRestart: () => void
    onReturnToDecks: () => void
}

const TrialResultSummary = forwardRef<HTMLButtonElement, TrialResultSummaryProps>(function TrialResultSummary({
    deck,
    correctAnswers,
    totalQuestions,
    percentage,
    requirements,
    savedResult,
    resultError,
    isSavingResult,
    mistakeCount,
    animateResult,
    onResultAnimationComplete,
    onReview,
    onRetrySave,
    onRestart,
    onReturnToDecks
}, reviewButtonRef) {
    const { t } = useI18n()
    const { palette } = useTheme()
    const language = languages.find(option => option.code === deck.learningLanguage.toLowerCase())
    const earnedStars = savedResult?.earnedStars ?? 0
    const bestStars = savedResult?.bestStars ?? 0
    const ringLabel = t.trials.resultRingLabel
        .replace("{percentage}", String(percentage))
        .replace("{correct}", String(correctAnswers))
        .replace("{total}", String(totalQuestions))
        .replace("{stars}", String(earnedStars))
        .replace("{requirements}", requirements.map(requirement => `${requirement.stars}: ${requirement.requiredCorrect}`).join(", "))

    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-[138rem] flex-col px-4 py-6 text-white sm:px-8 lg:px-12">
            <h1 className="text-center text-4xl font-black sm:text-5xl">{t.trials.results}</h1>

            <div className="grid flex-1 items-center gap-8 py-7 lg:grid-cols-[minmax(13rem,0.8fr)_minmax(22rem,1.45fr)_minmax(13rem,0.8fr)] lg:gap-10">
                <section className="min-w-0 text-center lg:h-[25rem] lg:justify-self-start lg:text-left" aria-labelledby="trial-result-deck-name">
                    <div className="flex min-w-0 items-center justify-center gap-4 lg:justify-start">
                        <h2 id="trial-result-deck-name" className="min-w-0 break-words text-[clamp(2.25rem,2.5vw,4rem)] font-black leading-tight">{deck.name}</h2>
                        {language && <img src={language.flagUrl} alt="" className="h-10 w-14 shrink-0 rounded object-cover shadow sm:h-12 sm:w-16" />}
                    </div>
                    <p className="mt-3 text-[clamp(1.25rem,1.4vw,2.25rem)] font-semibold text-white/70">{totalQuestions} {t.deckPage.words.toLowerCase()}</p>
                </section>

                <TrialResultRing
                    percentage={percentage}
                    totalQuestions={totalQuestions}
                    earnedStars={earnedStars}
                    requirements={requirements}
                    animate={animateResult}
                    ariaLabel={ringLabel}
                    onAnimationComplete={onResultAnimationComplete}
                />

                <section className="flex flex-col items-center text-center lg:h-[25rem] lg:justify-self-end lg:items-end lg:text-right" aria-label={t.trials.resultDetails}>
                    <p className="text-[clamp(1.25rem,1.4vw,2.25rem)] font-semibold text-white/65">{t.trials.percentage}</p>
                    <p className="mt-1 text-[clamp(3rem,3.75vw,6rem)] font-black leading-none">{percentage}%</p>
                    <p className="mt-12 text-[clamp(1.25rem,1.4vw,2.25rem)] font-semibold text-white/65">{t.trials.correctAnswers}</p>
                    <p className="mt-1 text-[clamp(2.5rem,3.75vw,6rem)] font-black leading-none">{correctAnswers} / {totalQuestions}</p>

                    {mistakeCount > 0 && (
                        <button
                            ref={reviewButtonRef}
                            type="button"
                            onClick={onReview}
                            className={`mt-10 rounded-full px-6 py-3 font-black shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${palette.primaryButton} ${palette.primaryButtonText}`}
                        >
                            {t.trials.reviewMistakes}
                        </button>
                    )}
                </section>
            </div>

            {savedResult && savedResult.bestStars > savedResult.earnedStars && (
                <p className="text-center text-sm font-bold text-white/65">
                    {t.trials.bestRatingRemains
                        .replace("{stars}", String(savedResult.bestStars))
                        .replace("{maximum}", "3")}
                </p>
            )}

            {resultError && (
                <div className="mx-auto mb-5 w-full max-w-2xl rounded-xl border border-red-300/35 bg-red-950/80 p-4 text-center">
                    <p className="font-black text-red-100">{t.trials.resultSaveError}</p>
                    <p className="mt-1 break-words text-sm text-red-100/70">{resultError}</p>
                    <button
                        type="button"
                        onClick={onRetrySave}
                        disabled={isSavingResult}
                        className="mt-3 inline-flex items-center gap-2 font-black text-white underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-60"
                    >
                        <RefreshCw size={17} className={isSavingResult ? "animate-spin" : ""} />
                        {isSavingResult ? t.trials.resultPending : t.trials.retrySave}
                    </button>
                </div>
            )}

            <div className="flex flex-col items-center justify-center gap-3 pb-4 sm:flex-row">
                {savedResult && bestStars < 3 && (
                    <button type="button" onClick={onRestart} className={`w-full rounded-full px-7 py-3 font-black sm:w-auto ${palette.primaryButton} ${palette.primaryButtonText}`}>
                        {bestStars === 0 ? t.trials.tryAgain : t.trials.improveResult}
                    </button>
                )}
                <button type="button" onClick={onReturnToDecks} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-black/35 px-7 py-3 font-black transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto">
                    <ArrowLeft size={18} /> {t.trials.returnToDecks}
                </button>
            </div>
        </div>
    )
})

export default TrialResultSummary
