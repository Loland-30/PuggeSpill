import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { getDeck, submitTrialResult, type Deck, type TrialResult } from "../api/decks"
import FadeIn from "../components/FadeIn"
import ThemedPage from "../components/ThemedPage"
import TrialProgress from "../components/trials/TrialProgress"
import TrialQuestionCard from "../components/trials/TrialQuestionCard"
import { useDeckTrialSession } from "../hooks/useDeckTrialSession"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"
import { TRIAL_PASS_THRESHOLD_PERCENT } from "../utils/trialRules"

export default function TrialPage() {
    const { deckId } = useParams()
    const { t } = useI18n()
    const [deck, setDeck] = useState<Deck | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const parsedDeckId = Number(deckId)
    const hasValidDeckId = Number.isInteger(parsedDeckId) && parsedDeckId > 0

    useEffect(() => {
        if (!hasValidDeckId) return

        let cancelled = false
        getDeck(parsedDeckId)
            .then(nextDeck => {
                if (!cancelled) setDeck(nextDeck)
            })
            .catch(() => {
                if (!cancelled) setError(t.trials.deckNotFound)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [hasValidDeckId, parsedDeckId, t.trials.deckNotFound])

    if (!hasValidDeckId) return <TrialMessage message={t.trials.deckNotFound} />
    if (loading) return <TrialMessage message={t.common.loading} />
    if (error || !deck) return <TrialMessage message={error || t.trials.deckNotFound} />
    if (deck.words.length === 0) return <TrialMessage message={t.trials.zeroWords} />

    return <TrialRunner deck={deck} />
}

function TrialMessage({ message }: { message: string }) {
    const navigate = useNavigate()
    const { t } = useI18n()
    const { palette } = useTheme()

    return (
        <ThemedPage className="grid min-h-dvh place-items-center px-4 text-white">
            <div className="relative z-10 max-w-lg text-center">
                <p className="text-xl font-black">{message}</p>
                <button
                    type="button"
                    onClick={() => navigate("/decks?mode=trial")}
                    className={`mt-6 rounded-full px-6 py-3 font-black ${palette.primaryButton} ${palette.primaryButtonText}`}
                >
                    {t.trials.returnToDecks}
                </button>
            </div>
        </ThemedPage>
    )
}

function TrialRunner({ deck }: { deck: Deck }) {
    const navigate = useNavigate()
    const { t } = useI18n()
    const { palette } = useTheme()
    const [answer, setAnswer] = useState("")
    const [savedResult, setSavedResult] = useState<TrialResult | null>(null)
    const [resultError, setResultError] = useState("")
    const [submittingResult, setSubmittingResult] = useState(false)
    const trial = useDeckTrialSession(deck)

    const saveResult = useCallback(async () => {
        setSubmittingResult(true)
        setResultError("")
        try {
            setSavedResult(await submitTrialResult(deck.id, trial.correctCount, trial.questions.length))
        } catch (error) {
            setResultError(error instanceof Error ? error.message : t.trials.resultSaveError)
        } finally {
            setSubmittingResult(false)
        }
    }, [deck.id, t.trials.resultSaveError, trial.correctCount, trial.questions.length])

    useEffect(() => {
        if (!trial.isComplete || savedResult || resultError || submittingResult) return

        const timeout = window.setTimeout(() => void saveResult(), 0)
        return () => window.clearTimeout(timeout)
    }, [resultError, saveResult, savedResult, submittingResult, trial.isComplete])

    const restart = () => {
        trial.restart()
        setAnswer("")
        setSavedResult(null)
        setResultError("")
    }

    if (trial.isComplete) {
        return (
            <ThemedPage className="min-h-dvh px-4 py-8 text-white sm:px-8">
                <FadeIn className="relative z-10 mx-auto w-full max-w-4xl">
                    <div className={`rounded-2xl border ${palette.border} ${palette.card} ${palette.glow} p-5 shadow-2xl sm:rounded-3xl sm:p-9`}>
                        <p className={`text-sm font-black uppercase tracking-[0.24em] ${palette.accentText}`}>{t.trials.complete}</p>
                        <h1 className="mt-3 text-4xl font-black sm:text-6xl">
                            {savedResult ? (savedResult.passed ? t.trials.passed : t.trials.failed) : t.trials.resultPending}
                        </h1>
                        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <ResultStat label={t.trials.correct} value={`${trial.correctCount} / ${trial.questions.length}`} />
                            <ResultStat label={t.trials.percentage} value={`${trial.accuracy}%`} />
                            <ResultStat label={t.trials.required} value={`${TRIAL_PASS_THRESHOLD_PERCENT}%`} />
                        </div>

                        {resultError && (
                            <div className="mt-6 rounded-xl border border-red-300/30 bg-red-500/10 p-4">
                                <p className="font-bold text-red-200">{t.trials.resultSaveError}</p>
                                <p className="mt-1 text-sm text-red-100/70">{resultError}</p>
                                <button type="button" onClick={() => void saveResult()} className="mt-3 inline-flex items-center gap-2 font-black text-white underline">
                                    <RefreshCw size={17} /> {t.trials.retrySave}
                                </button>
                            </div>
                        )}

                        {trial.incorrectAnswers.length > 0 && (
                            <section className="mt-8 border-t border-white/10 pt-7">
                                <h2 className="text-2xl font-black">{t.trials.incorrectQuestions}</h2>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {trial.incorrectAnswers.map((record, index) => (
                                        <div key={`${record.question.wordId}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                            <p className="font-black text-white">{record.question.prompt}</p>
                                            <p className="mt-2 text-sm text-white/55">{t.trials.yourAnswer}: {record.submittedAnswer || t.trials.noAnswer}</p>
                                            <p className="text-sm text-white/80">{t.trials.correctAnswer}: {record.question.correctAnswer}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button type="button" onClick={restart} className={`rounded-full px-6 py-3 font-black ${palette.primaryButton} ${palette.primaryButtonText}`}>
                                {t.trials.retryTrial}
                            </button>
                            <button type="button" onClick={() => navigate("/decks?mode=trial")} className="rounded-full border border-white/15 bg-white/5 px-6 py-3 font-black transition hover:bg-white/10">
                                {t.trials.returnToDecks}
                            </button>
                        </div>
                    </div>
                </FadeIn>
            </ThemedPage>
        )
    }

    return (
        <ThemedPage className="min-h-dvh px-4 py-6 text-white sm:px-8 sm:py-10">
            <button
                type="button"
                onClick={() => navigate("/decks?mode=trial")}
                className="relative z-20 inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-sm font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
                <ArrowLeft size={18} /> {t.common.close}
            </button>
            <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-2xl flex-col justify-center gap-8">
                <TrialProgress current={trial.currentIndex + 1} total={trial.questions.length} />
                {trial.currentQuestion && (
                    <FadeIn key={`${trial.currentQuestion.wordId}-${trial.currentQuestion.direction}`}>
                        <TrialQuestionCard
                            title={deck.name}
                            source={trial.currentQuestion.prompt}
                            answer={answer}
                            onAnswerChange={setAnswer}
                            onSubmit={() => {
                                trial.submitAnswer(answer)
                                setAnswer("")
                            }}
                        />
                    </FadeIn>
                )}
                <p className="text-center text-sm font-semibold text-white/50">{t.trials.examNote}</p>
            </div>
        </ThemedPage>
    )
}

function ResultStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
            <p className="text-sm font-bold text-white/55">{label}</p>
            <p className="mt-1 text-3xl font-black text-white">{value}</p>
        </div>
    )
}
