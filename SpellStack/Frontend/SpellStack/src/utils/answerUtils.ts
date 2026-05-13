export function normalizeAnswer(value: string) {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
}

export function splitAcceptedAnswers(value: string | null | undefined) {
    return value?.split(",").map(answer => answer.trim()).filter(Boolean) ?? []
}

export function isAnswerAccepted(answer: string, correctAnswer: string, acceptedAnswers: string[] = []) {
    const normalizedAnswer = normalizeAnswer(answer)
    const acceptedCandidates = [correctAnswer, ...acceptedAnswers]
        .map(candidate => normalizeAnswer(candidate))
        .filter(Boolean)

    return acceptedCandidates.some(candidate => normalizedAnswer === candidate)
}
