import { useEffect, useMemo, useState } from "react"
import { Star } from "lucide-react"
import { useReducedMotion } from "framer-motion"

import type { TrialStarRequirement } from "../../api/decks"
import { getRingPalette } from "../results/GradeRing"
import { useTheme } from "../../theme/ThemeContext"
import { clamp, polarToSvgPoint } from "../../utils/rankUtils"

interface TrialResultRingProps {
    percentage: number
    totalQuestions: number
    earnedStars: number
    requirements: TrialStarRequirement[]
    animate: boolean
    ariaLabel: string
    onAnimationComplete?: () => void
}

const RING_RADIUS = 142
const ANIMATION_DURATION_MS = 1100

export default function TrialResultRing({
    percentage,
    totalQuestions,
    earnedStars,
    requirements,
    animate,
    ariaLabel,
    onAnimationComplete
}: TrialResultRingProps) {
    const { theme } = useTheme()
    const reduceMotion = useReducedMotion()
    const targetPercentage = clamp(percentage, 0, 100)
    const shouldAnimate = animate && !reduceMotion
    const [animatedPercentage, setAnimatedPercentage] = useState(() => shouldAnimate ? 0 : targetPercentage)
    const ring = getRingPalette(theme.paletteId)
    const circumference = 2 * Math.PI * RING_RADIUS
    const progress = circumference * animatedPercentage / 100
    const gradientId = `trial-ring-${theme.paletteId}`

    const revealedStars = useMemo(() => requirements.reduce((highest, requirement) => {
        const thresholdPosition = requirement.requiredCorrect * 100 / totalQuestions
        return animatedPercentage + 0.001 >= thresholdPosition && earnedStars >= requirement.stars
            ? Math.max(highest, requirement.stars)
            : highest
    }, 0), [animatedPercentage, earnedStars, requirements, totalQuestions])

    useEffect(() => {
        if (!shouldAnimate) {
            return
        }

        const startedAt = window.performance.now()
        let frame = 0

        const tick = (now: number) => {
            const ratio = clamp((now - startedAt) / ANIMATION_DURATION_MS, 0, 1)
            const eased = 1 - Math.pow(1 - ratio, 3)
            setAnimatedPercentage(targetPercentage * eased)

            if (ratio < 1) {
                frame = window.requestAnimationFrame(tick)
                return
            }

            setAnimatedPercentage(targetPercentage)
            onAnimationComplete?.()
        }

        frame = window.requestAnimationFrame(tick)
        return () => window.cancelAnimationFrame(frame)
    }, [onAnimationComplete, shouldAnimate, targetPercentage])

    return (
        <div className="flex min-w-0 flex-col items-center">
            <div
                role="img"
                aria-label={ariaLabel}
                className="relative grid h-[clamp(17rem,42vw,44rem)] w-[clamp(17rem,42vw,44rem)] place-items-center"
            >
                <svg viewBox="0 0 360 360" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={ring.from} />
                            <stop offset="100%" stopColor={ring.to} />
                        </linearGradient>
                    </defs>

                    <g transform="rotate(-90 180 180)">
                        <circle cx="180" cy="180" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="18" />
                        <circle
                            cx="180"
                            cy="180"
                            r={RING_RADIUS}
                            fill="none"
                            stroke={`url(#${gradientId})`}
                            strokeLinecap="round"
                            strokeWidth="18"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - progress}
                        />
                    </g>

                    {requirements.map(requirement => {
                        const thresholdPosition = requirement.requiredCorrect * 100 / totalQuestions
                        const tickStart = polarToSvgPoint(180, 180, 153, thresholdPosition)
                        const tickEnd = polarToSvgPoint(180, 180, 168, thresholdPosition)
                        const starPosition = polarToSvgPoint(180, 180, 187, thresholdPosition)
                        const active = revealedStars >= requirement.stars

                        return (
                            <g key={requirement.stars}>
                                <line
                                    x1={tickStart.x}
                                    y1={tickStart.y}
                                    x2={tickEnd.x}
                                    y2={tickEnd.y}
                                    stroke="rgba(255,255,255,0.86)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                                <polygon
                                    points={createStarPoints(starPosition.x, starPosition.y, 12, 5.5)}
                                    fill={active ? ring.to : "rgba(3,7,18,0.7)"}
                                    stroke={active ? ring.to : "rgba(255,255,255,0.78)"}
                                    strokeWidth="2"
                                    className="transition-colors duration-200"
                                />
                            </g>
                        )
                    })}
                </svg>

            </div>

            <div className="mt-5 flex items-center justify-center gap-3 sm:gap-5" aria-hidden="true">
                {Array.from({ length: 3 }, (_, index) => {
                    const active = index < revealedStars
                    return (
                        <Star
                            key={index}
                            className={`h-12 w-12 transition-all duration-200 sm:h-16 sm:w-16 ${active ? "scale-100" : "scale-95 text-white/35"}`}
                            style={active ? { color: ring.to, fill: ring.to } : undefined}
                            strokeWidth={1.7}
                        />
                    )
                })}
            </div>
        </div>
    )
}

function createStarPoints(centerX: number, centerY: number, outerRadius: number, innerRadius: number) {
    return Array.from({ length: 10 }, (_, index) => {
        const radius = index % 2 === 0 ? outerRadius : innerRadius
        const angle = -Math.PI / 2 + index * Math.PI / 5
        return `${centerX + Math.cos(angle) * radius},${centerY + Math.sin(angle) * radius}`
    }).join(" ")
}
