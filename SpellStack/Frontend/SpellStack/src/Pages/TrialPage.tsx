import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { getDeck, submitTrialResult, type Deck, type TrialResult } from "../api/decks"
import FadeIn from "../components/FadeIn"
import ThemedPage from "../components/ThemedPage"
import TrialMistakeReview from "../components/trials/TrialMistakeReview"
import TrialProgress from "../components/trials/TrialProgress"
import TrialQuestionCard from "../components/trials/TrialQuestionCard"
import TrialResultSummary from "../components/trials/TrialResultSummary"
import { useDeckTrialSession } from "../hooks/useDeckTrialSession"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"
import { getTrialRequirements, isDeckTrialEligible } from "../utils/trialRules"

const RUN_COMPLETE_DURATION_MS = 750

type ResultView = "summary" | "review"

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
    if (!isDeckTrialEligible(deck.words.length)) return <TrialMessage message={t.trials.minimumWords} />

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
                    className={`mt-6 rounded-full px-6 py-3 font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${palette.primaryButton} ${palette.primaryButtonText}`}
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
    const reduceMotion = useReducedMotion()
    const [answer, setAnswer] = useState("")
    const [savedResult, setSavedResult] = useState<TrialResult | null>(null)
    const [resultError, setResultError] = useState("")
    const [submittingResult, setSubmittingResult] = useState(false)
    const [runCompleteFinished, setRunCompleteFinished] = useState(false)
    const [resultView, setResultView] = useState<ResultView>("summary")
    const [hasPlayedResultAnimation, setHasPlayedResultAnimation] = useState(false)
    const reviewButtonRef = useRef<HTMLButtonElement>(null)
    const reviewHeadingRef = useRef<HTMLHeadingElement>(null)
    const trial = useDeckTrialSession(deck)

    const saveResult = useCallback(async () => {
        setSubmittingResult(true)
        try {
            const result = await submitTrialResult(deck.id, trial.correctCount, trial.questions.length)
            setSavedResult(result)
            setResultError("")
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

    useEffect(() => {
        if (!trial.isComplete) return
        const timeout = window.setTimeout(
            () => setRunCompleteFinished(true),
            reduceMotion ? 0 : RUN_COMPLETE_DURATION_MS
        )
        return () => window.clearTimeout(timeout)
    }, [reduceMotion, trial.isComplete])

    useEffect(() => {
        if (resultView === "review") reviewHeadingRef.current?.focus()
    }, [resultView])

    const restart = () => {
        trial.restart()
        setAnswer("")
        setSavedResult(null)
        setResultError("")
        setRunCompleteFinished(false)
        setResultView("summary")
        setHasPlayedResultAnimation(false)
    }

    const openReview = () => {
        setHasPlayedResultAnimation(true)
        setResultView("review")
    }

    const returnToSummary = () => {
        setResultView("summary")
        window.setTimeout(() => reviewButtonRef.current?.focus(), reduceMotion ? 0 : 220)
    }

    if (trial.isComplete) {
        const resultResolved = Boolean(savedResult || resultError)
        if (!runCompleteFinished || !resultResolved) {
            return <TrialRunComplete saving={runCompleteFinished && submittingResult} />
        }

        const requirements = savedResult?.requirements ?? getTrialRequirements(trial.questions.length)
        const transition = reduceMotion
            ? { duration: 0 }
            : { duration: 0.2, ease: "easeOut" as const }

        return (
            <ThemedPage className="min-h-dvh overflow-x-hidden text-white">
                <div className="relative z-10 min-h-dvh">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={resultView}
                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                            transition={transition}
                        >
                            {resultView === "summary" ? (
                                <TrialResultSummary
                                    ref={reviewButtonRef}
                                    deck={deck}
                                    correctAnswers={trial.correctCount}
                                    totalQuestions={trial.questions.length}
                                    percentage={trial.accuracy}
                                    requirements={requirements}
                                    savedResult={savedResult}
                                    resultError={resultError}
                                    isSavingResult={submittingResult}
                                    mistakeCount={trial.incorrectAnswers.length}
                                    animateResult={!hasPlayedResultAnimation}
                                    onResultAnimationComplete={() => setHasPlayedResultAnimation(true)}
                                    onReview={openReview}
                                    onRetrySave={() => void saveResult()}
                                    onRestart={restart}
                                    onReturnToDecks={() => navigate("/decks?mode=trial")}
                                />
                            ) : (
                                <TrialMistakeReview
                                    ref={reviewHeadingRef}
                                    mistakes={trial.incorrectAnswers}
                                    totalQuestions={trial.questions.length}
                                    onBack={returnToSummary}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
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

function TrialRunComplete({ saving }: { saving: boolean }) {
    const { t } = useI18n()
    const reduceMotion = useReducedMotion()

    return (
        <ThemedPage className="grid min-h-dvh place-items-center text-white">
            <motion.div
                className="relative z-10 text-center"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
                role="status"
                aria-live="polite"
            >
                <p className="text-4xl font-black sm:text-6xl">{t.trials.runComplete}</p>
                {saving && <p className="mt-3 font-semibold text-white/65">{t.trials.resultPending}</p>}
            </motion.div>
        </ThemedPage>
    )
}
