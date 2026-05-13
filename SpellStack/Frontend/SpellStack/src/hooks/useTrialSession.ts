import { useMemo, useState } from "react"

import type { Trial, TrialWord } from "../data/trials/trialTypes"
import { isAnswerAccepted } from "../utils/answerUtils"

interface TrialAnswerRecord {
    question: TrialWord
    answer: string
    correct: boolean
}

function shuffleQuestions(words: TrialWord[]) {
    return [...words].sort(() => Math.random() - 0.5)
}

function pickTrialQuestions(trial: Trial) {
    return shuffleQuestions(trial.wordPool).slice(0, Math.min(trial.questionCount, trial.wordPool.length))
}

function getTrialRank(correctCount: number, questionCount: number, passingCorrect: number) {
    const accuracy = questionCount === 0 ? 0 : correctCount / questionCount

    if (accuracy >= 0.95) return { rank: "S", label: "Trial mastery", color: "text-yellow-400" }
    if (accuracy >= 0.85) return { rank: "A", label: "Excellent control", color: "text-green-400" }
    if (correctCount >= passingCorrect) return { rank: "B", label: "Trial passed", color: "text-sky-400" }
    if (correctCount >= passingCorrect - 2) return { rank: "C", label: "Almost there", color: "text-orange-400" }
    return { rank: "D", label: "Try again", color: "text-red-400" }
}

export function useTrialSession(trial: Trial) {
    const [attempt, setAttempt] = useState(0)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<TrialAnswerRecord[]>([])
    const [isComplete, setIsComplete] = useState(false)

    const questions = useMemo(() => pickTrialQuestions(trial), [trial, attempt])
    const currentQuestion = questions[currentIndex]
    const correctCount = answers.filter(answer => answer.correct).length
    const questionCount = questions.length
    const accuracy = questionCount === 0 ? 0 : Math.round((correctCount / questionCount) * 100)
    const passed = isComplete && correctCount >= trial.passingCorrect
    const rank = getTrialRank(correctCount, questionCount, trial.passingCorrect)

    const submitAnswer = (answer: string) => {
        if (isComplete || !currentQuestion) return

        const correct = isAnswerAccepted(answer, currentQuestion.answer, currentQuestion.acceptedAnswers)
        const nextAnswers = [
            ...answers,
            {
                question: currentQuestion,
                answer,
                correct
            }
        ]

        setAnswers(nextAnswers)

        if (currentIndex >= questions.length - 1) {
            setIsComplete(true)
            return
        }

        setCurrentIndex(index => index + 1)
    }

    const restart = () => {
        setAttempt(value => value + 1)
        setCurrentIndex(0)
        setAnswers([])
        setIsComplete(false)
    }

    return {
        questions,
        currentQuestion,
        currentIndex,
        answers,
        isComplete,
        correctCount,
        questionCount,
        accuracy,
        passed,
        rank,
        submitAnswer,
        restart
    }
}
