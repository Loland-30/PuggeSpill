export const rankThresholds = [
    { label: "D", minAccuracy: 0 },
    { label: "C", minAccuracy: 45 },
    { label: "B", minAccuracy: 65 },
    { label: "A", minAccuracy: 80 },
    { label: "S", minAccuracy: 90 }
] as const

export const visibleRankMarkers = rankThresholds.filter(rank => rank.label !== "D")

export type RankLabel = typeof rankThresholds[number]["label"]

export function getRankFromAccuracy(accuracy: number): RankLabel {
    const reversedThresholds = [...rankThresholds].reverse()

    return reversedThresholds.find(threshold => {
        return accuracy >= threshold.minAccuracy
    })?.label ?? "D"
}

export function getNextRankText(accuracy: number) {
    const nextRank = rankThresholds.find(threshold => {
        return accuracy < threshold.minAccuracy
    })

    if (!nextRank) return "Top rank reached"

    const difference = Math.ceil(nextRank.minAccuracy - accuracy)

    return `${difference}% to ${nextRank.label}`
}

export function polarToSvgPoint(centerX: number, centerY: number, radius: number, accuracy: number) {
    const angleRadians = getAccuracyAngleRadians(accuracy)

    return {
        x: centerX + radius * Math.cos(angleRadians),
        y: centerY + radius * Math.sin(angleRadians)
    }
}

export function getAccuracyAngleRadians(accuracy: number) {
    const clampedAccuracy = clamp(accuracy, 0, 100)
    const angleDegrees = clampedAccuracy * 3.6 - 90

    return angleDegrees * (Math.PI / 180)
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}
