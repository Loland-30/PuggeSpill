import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core"
import * as common from "@zxcvbn-ts/language-common"

zxcvbnOptions.setOptions({
    dictionary: common.dictionary,
    graphs: common.adjacencyGraphs
})

export const minimumPasswordStrengthScore = 2

export type PasswordStrength = {
    score: number
    level: number
    label: "Weak" | "Fair" | "Strong" | "Very strong"
    meetsMinimum: boolean
}

export function estimatePasswordStrength(
    password: string,
    userInputs: string[] = []
): PasswordStrength {
    if (!password) {
        return {
            score: 0,
            level: 0,
            label: "Weak",
            meetsMinimum: false
        }
    }

    const score = zxcvbn(password, userInputs.filter(Boolean)).score
    const level = score <= 1 ? 1 : score
    const labels = ["Weak", "Weak", "Fair", "Strong", "Very strong"] as const

    return {
        score,
        level,
        label: labels[score],
        meetsMinimum: score >= minimumPasswordStrengthScore
    }
}
