import { useEffect, useRef, useState } from "react"
import { useTheme } from "../../theme/ThemeContext"
import type { PaletteThemeId } from "../../theme/themes"
import { clamp, getRankFromAccuracy, polarToSvgPoint, visibleRankMarkers, type RankLabel } from "../../utils/rankUtils"

interface GradeRingProps {
    accuracy: number
    rank: RankLabel
    animate?: boolean
    animationDurationMs?: number
    className?: string
    fillVisible?: boolean
    onAnimationComplete?: () => void
    showMarkers?: boolean
    sizeClassName?: string
}

export default function GradeRing({
    accuracy,
    rank,
    animate = false,
    animationDurationMs = 900,
    className = "",
    fillVisible = true,
    onAnimationComplete,
    showMarkers = true,
    sizeClassName = "h-[clamp(22rem,30vw,32rem)] w-[clamp(22rem,30vw,32rem)]"
}: GradeRingProps) {
    const { theme } = useTheme()
    const targetAccuracy = fillVisible ? accuracy : 0
    const [animatedAccuracy, setAnimatedAccuracy] = useState(() => animate && fillVisible ? 0 : targetAccuracy)
    const displayRank = animate || !fillVisible ? getRankFromAccuracy(animatedAccuracy) : rank
    const previousDisplayRank = useRef(displayRank)
    const [rankPop, setRankPop] = useState(false)

    const ring = getRingPalette(theme.paletteId)
    const radius = 142
    const circumference = 2 * Math.PI * radius
    const progress = circumference * (clamp(animatedAccuracy, 0, 100) / 100)

    useEffect(() => {
        if (!fillVisible) {
            setAnimatedAccuracy(0)
            return
        }

        if (!animate) {
            setAnimatedAccuracy(accuracy)
            return
        }

        setAnimatedAccuracy(0)

        const startTime = window.performance.now()
        let frame = 0

        const tick = (now: number) => {
            const elapsed = now - startTime
            const progressRatio = clamp(elapsed / animationDurationMs, 0, 1)
            const easedProgress = 1 - Math.pow(1 - progressRatio, 3)

            setAnimatedAccuracy(accuracy * easedProgress)

            if (progressRatio < 1) {
                frame = window.requestAnimationFrame(tick)
                return
            }

            setAnimatedAccuracy(accuracy)
            onAnimationComplete?.()
        }

        frame = window.requestAnimationFrame(tick)

        return () => {
            window.cancelAnimationFrame(frame)
        }
    }, [accuracy, animate, animationDurationMs, fillVisible, onAnimationComplete, theme.paletteId])

    useEffect(() => {
        if (previousDisplayRank.current === displayRank) {
            return
        }

        previousDisplayRank.current = displayRank
        setRankPop(true)

        const timer = window.setTimeout(() => {
            setRankPop(false)
        }, 180)

        return () => {
            window.clearTimeout(timer)
        }
    }, [displayRank])

    return (
        <div className={`relative grid place-items-center ${sizeClassName} ${className}`}>
            <svg
                viewBox="0 0 360 360"
                className="absolute inset-0 h-full w-full overflow-visible"
            >
                <defs>
                    <linearGradient
                        id={`grade-ring-${theme.paletteId}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor={ring.from} />
                        <stop offset="100%" stopColor={ring.to} />
                    </linearGradient>
                </defs>

                <g transform="rotate(-90 180 180)">
                    <circle
                        cx="180"
                        cy="180"
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="18"
                    />

                    <circle
                        cx="180"
                        cy="180"
                        r={radius}
                        fill="none"
                        stroke={`url(#grade-ring-${theme.paletteId})`}
                        strokeLinecap="round"
                        strokeWidth="18"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                    />
                </g>

                {showMarkers && visibleRankMarkers.map(threshold => (
                    <RankTick
                        key={threshold.label}
                        accuracy={threshold.minAccuracy}
                    />
                ))}

                {showMarkers && visibleRankMarkers.map(threshold => (
                    <RankLabelMarker
                        key={threshold.label}
                        label={threshold.label}
                        accuracy={threshold.minAccuracy}
                        active={threshold.label === rank}
                    />
                ))}
            </svg>

            <p className={`text-6xl font-black text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.2)] transition-transform duration-200 ease-out sm:text-8xl md:text-9xl ${rankPop ? "scale-110" : "scale-100"}`}>
                {displayRank}
            </p>
        </div>
    )
}

function RankTick({ accuracy }: { accuracy: number }) {
    const start = polarToSvgPoint(180, 180, 153, accuracy)
    const end = polarToSvgPoint(180, 180, 170, accuracy)

    return (
        <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
        />
    )
}

function RankLabelMarker({
    label,
    accuracy,
    active
}: {
    label: RankLabel
    accuracy: number
    active: boolean
}) {
    const tickEndRadius = 170
    const labelOffset = 18
    const position = polarToSvgPoint(180, 180, tickEndRadius + labelOffset, accuracy)

    return (
        <text
            x={position.x}
            y={position.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={active ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.75)"}
            fontSize="24"
            fontWeight={active ? 900 : 400}
            className="pointer-events-none transition"
        >
            {label}
        </text>
    )
}

export function getRingPalette(paletteId: PaletteThemeId) {
    const ringPalettes: Record<PaletteThemeId, { from: string; to: string }> = {
        blue: { from: "#38bdf8", to: "#0ea5e9" },
        pink: { from: "#f472b6", to: "#ec4899" },
        green: { from: "#34d399", to: "#10b981" },
        red: { from: "#f87171", to: "#ef4444" },
        yellow: { from: "#fcb103", to: "#f5c542" },
        orange: { from: "#F87002", to: "#FDA460" },
        purple: { from: "#8B5CF6", to: "#C084FC" },
        white: { from: "#ffffff", to: "#d1d5db" },
        purpleGradient: { from: "#f43f5e", to: "#7c3aed" },
        mangoPop: { from: "#ff0f7b", to: "#f89b29" },
        frostByte: { from: "#0061ff", to: "#60efff" }
    }

    return ringPalettes[paletteId]
}
