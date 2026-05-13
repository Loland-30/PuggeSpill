import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import FadeIn from "../components/FadeIn"
import RunResultScreen from "../components/game/RunResultScreen"
import TrialProgress from "../components/trials/TrialProgress"
import TrialQuestionCard from "../components/trials/TrialQuestionCard"
import { trials } from "../data/trials/trials"
import type { Trial } from "../data/trials/trialTypes"
import { useTrialSession } from "../hooks/useTrialSession"
import { recordTestingTrialAttempt } from "../testing/unlockRank"

export default function TrialPage() {
    const navigate = useNavigate()
    const { trialId } = useParams()
    const trial = trials.find(candidate => candidate.id === trialId)

    if (!trial) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-orange-400">Trial not found</p>
                <h1 className="text-4xl font-black text-gray-800">Could not find that trial</h1>
                <button
                    onClick={() => navigate("/trials")}
                    className="rounded-full bg-orange-400 px-8 py-3 font-bold text-white transition hover:bg-orange-500"
                >
                    Back to decks
                </button>
            </div>
        )
    }

    return <TrialRunner trial={trial} />
}

function TrialRunner({ trial }: { trial: Trial }) {
    const navigate = useNavigate()
    const [answer, setAnswer] = useState("")
    const trialSession = useTrialSession(trial)
    const recordedAttemptRef = useRef(false)

    useEffect(() => {
        if (!trialSession.isComplete || recordedAttemptRef.current) return

        recordTestingTrialAttempt(trial.id)
        recordedAttemptRef.current = true
    }, [trial.id, trialSession.isComplete])

    const handleSubmit = () => {
        trialSession.submitAnswer(answer)
        setAnswer("")
    }

    if (trialSession.isComplete) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-6">
                <FadeIn>
                    <RunResultScreen
                        outcome={trialSession.passed ? "trialPassed" : "trialFailed"}
                        modeLabel="Trial complete"
                        rank={trialSession.rank}
                        title={trialSession.passed ? "Trial passed" : "Trial failed"}
                        subtitle={`${trialSession.correctCount} / ${trialSession.questionCount} correct. Needed ${trial.passingCorrect}.`}
                        stats={[
                            { label: "Correct", value: trialSession.correctCount },
                            { label: "Needed", value: trial.passingCorrect },
                            { label: "Accuracy", value: `${trialSession.accuracy}%` },
                            { label: "Questions", value: trialSession.questionCount }
                        ]}
                        primaryActionLabel="Try again"
                        secondaryActionLabel="Exit"
                        onPrimaryAction={() => {
                            recordedAttemptRef.current = false
                            trialSession.restart()
                            setAnswer("")
                        }}
                        onSecondaryAction={() => navigate("/trials")}
                    />
                </FadeIn>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-10">
            <button
                onClick={() => navigate("/trials")}
                className="absolute left-8 top-8 text-sm text-gray-400 transition hover:text-gray-600"
            >
                Exit
            </button>

            <div className="w-full max-w-xl space-y-8">
                <TrialProgress
                    current={trialSession.currentIndex + 1}
                    total={trialSession.questionCount}
                />

                {trialSession.currentQuestion && (
                    <FadeIn key={trialSession.currentQuestion.source}>
                        <TrialQuestionCard
                            title={trial.title}
                            source={trialSession.currentQuestion.source}
                            answer={answer}
                            onAnswerChange={setAnswer}
                            onSubmit={handleSubmit}
                        />
                    </FadeIn>
                )}

                <p className="text-center text-sm font-semibold text-gray-400">
                    No hints, no timer, no feedback until the end.
                </p>
            </div>
        </div>
    )
}
