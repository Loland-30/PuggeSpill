const TRIAL_RANK_STORAGE_KEY = "spellstack_testing_trial_ranks"
const TRIAL_ATTEMPT_STORAGE_KEY = "spellstack_testing_trial_attempts"
const TRIAL_ONE_UNLOCK_ATTEMPTS = 1

export interface TestingTrialRank {
    name: string
}

function readSessionJson<T>(key: string, fallback: T): T {
    const storedValue = sessionStorage.getItem(key)
    if (!storedValue) return fallback

    try {
        return JSON.parse(storedValue) as T
    } catch {
        return fallback
    }
}

function writeSessionJson<T>(key: string, value: T) {
    sessionStorage.setItem(key, JSON.stringify(value))
}

export function getTestingTrialRank(trialId: string): TestingTrialRank | null {
    const ranks = readSessionJson<Record<string, TestingTrialRank>>(TRIAL_RANK_STORAGE_KEY, {})
    return ranks[trialId] ?? null
}

export function recordTestingTrialAttempt(trialId: string) {
    const attempts = readSessionJson<Record<string, number>>(TRIAL_ATTEMPT_STORAGE_KEY, {})
    const nextAttemptCount = (attempts[trialId] ?? 0) + 1

    writeSessionJson(TRIAL_ATTEMPT_STORAGE_KEY, {
        ...attempts,
        [trialId]: nextAttemptCount
    })

    if (trialId !== "spanish-trial-1" || nextAttemptCount < TRIAL_ONE_UNLOCK_ATTEMPTS) return

    const ranks = readSessionJson<Record<string, TestingTrialRank>>(TRIAL_RANK_STORAGE_KEY, {})
    writeSessionJson(TRIAL_RANK_STORAGE_KEY, {
        ...ranks,
        [trialId]: {
            name: "Bronze"
        }
    })
}
