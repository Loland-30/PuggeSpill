import { useEffect, useMemo, useState } from "react"

import type { Deck, Word } from "../api/decks"
import { isAnswerAccepted, splitAcceptedAnswers } from "../utils/answerUtils"

export type TrialDirection = "original-to-translation" | "translation-to-original"

export interface DeckTrialQuestion {
    wordId: number
    direction: TrialDirection
    prompt: string
    correctAnswer: string
    acceptedAnswers: string[]
}

export interface DeckTrialAnswer {
    question: DeckTrialQuestion
    submittedAnswer: string
    correct: boolean
}

interface StoredTrialSession {
    contentRevision: number
    questions: Array<{ wordId: number; direction: TrialDirection }>
    currentIndex: number
    answers: DeckTrialAnswer[]
    isComplete: boolean
}

function shuffle<T>(items: T[]) {
    const shuffled = [...items]
    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
    }
    return shuffled
}

function toQuestion(word: Word, direction: TrialDirection): DeckTrialQuestion {
    const originalToTranslation = direction === "original-to-translation"
    return {
        wordId: word.id,
        direction,
        prompt: originalToTranslation ? word.original : word.translation,
        correctAnswer: originalToTranslation ? word.translation : word.original,
        acceptedAnswers: splitAcceptedAnswers(originalToTranslation ? word.alternativeTranslation : word.alternativeOriginal)
    }
}

function createQuestions(deck: Deck) {
    return shuffle(deck.words).map(word =>
        toQuestion(word, Math.random() < 0.5 ? "original-to-translation" : "translation-to-original")
    )
}

function storageKey(deckId: number) {
    return `spellstack_deck_trial_${deckId}`
}

function loadStoredSession(deck: Deck): StoredTrialSession | null {
    try {
        const raw = window.sessionStorage.getItem(storageKey(deck.id))
        if (!raw) return null
        const stored = JSON.parse(raw) as StoredTrialSession
        const wordIds = new Set(deck.words.map(word => word.id))
        const validQuestions = stored.questions.length === deck.words.length &&
            stored.questions.every(question => wordIds.has(question.wordId))

        return stored.contentRevision === deck.contentRevision && validQuestions ? stored : null
    } catch {
        return null
    }
}

function hydrateQuestions(deck: Deck, storedQuestions: StoredTrialSession["questions"]) {
    const words = new Map(deck.words.map(word => [word.id, word]))
    return storedQuestions.map(question => toQuestion(words.get(question.wordId)!, question.direction))
}

export function useDeckTrialSession(deck: Deck) {
    const restored = useMemo(() => loadStoredSession(deck), [deck])
    const [questions, setQuestions] = useState<DeckTrialQuestion[]>(() =>
        restored ? hydrateQuestions(deck, restored.questions) : createQuestions(deck)
    )
    const [currentIndex, setCurrentIndex] = useState(restored?.currentIndex ?? 0)
    const [answers, setAnswers] = useState<DeckTrialAnswer[]>(restored?.answers ?? [])
    const [isComplete, setIsComplete] = useState(restored?.isComplete ?? false)

    const correctCount = answers.filter(answer => answer.correct).length
    const accuracy = questions.length === 0
        ? 0
        : Math.round(correctCount * 10_000 / questions.length) / 100
    const currentQuestion = questions[currentIndex]

    useEffect(() => {
        const stored: StoredTrialSession = {
            contentRevision: deck.contentRevision,
            questions: questions.map(question => ({ wordId: question.wordId, direction: question.direction })),
            currentIndex,
            answers,
            isComplete
        }
        window.sessionStorage.setItem(storageKey(deck.id), JSON.stringify(stored))
    }, [answers, currentIndex, deck.contentRevision, deck.id, isComplete, questions])

    const submitAnswer = (submittedAnswer: string) => {
        if (isComplete || !currentQuestion) return

        const record: DeckTrialAnswer = {
            question: currentQuestion,
            submittedAnswer,
            correct: isAnswerAccepted(submittedAnswer, currentQuestion.correctAnswer, currentQuestion.acceptedAnswers)
        }
        setAnswers(current => [...current, record])

        if (currentIndex >= questions.length - 1) setIsComplete(true)
        else setCurrentIndex(index => index + 1)
    }

    const restart = () => {
        const nextQuestions = createQuestions(deck)
        setQuestions(nextQuestions)
        setCurrentIndex(0)
        setAnswers([])
        setIsComplete(false)
    }

    return {
        questions,
        currentQuestion,
        currentIndex,
        answers,
        incorrectAnswers: answers.filter(answer => !answer.correct),
        isComplete,
        correctCount,
        accuracy,
        submitAnswer,
        restart
    }
}
