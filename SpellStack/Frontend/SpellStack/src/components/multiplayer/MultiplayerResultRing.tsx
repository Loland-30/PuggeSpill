import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"

import { useTheme } from "../../theme/ThemeContext"
import { clamp, polarToSvgPoint, visibleRankMarkers } from "../../utils/rankUtils"
import { getRingPalette } from "../results/GradeRing"

const RING_RADIUS = 142
const ANIMATION_DURATION_MS = 1100

export default function MultiplayerResultRing({ accuracy }: { accuracy: number }) {
    const { theme } = useTheme()
    const reduceMotion = useReducedMotion()
    const targetAccuracy = clamp(accuracy, 0, 100)
    const [animatedAccuracy, setAnimatedAccuracy] = useState(() => reduceMotion ? targetAccuracy : 0)
    const ring = getRingPalette(theme.paletteId)
    const circumference = 2 * Math.PI * RING_RADIUS
    const gradientId = `multiplayer-result-ring-${theme.paletteId}`

    useEffect(() => {
        if (reduceMotion) return

        const startedAt = window.performance.now()
        let frame = 0
        const tick = (now: number) => {
            const ratio = clamp((now - startedAt) / ANIMATION_DURATION_MS, 0, 1)
            setAnimatedAccuracy(targetAccuracy * (1 - Math.pow(1 - ratio, 3)))
            if (ratio < 1) frame = window.requestAnimationFrame(tick)
            else setAnimatedAccuracy(targetAccuracy)
        }

        frame = window.requestAnimationFrame(tick)
        return () => window.cancelAnimationFrame(frame)
    }, [reduceMotion, targetAccuracy])

    const displayedAccuracy = reduceMotion ? targetAccuracy : animatedAccuracy
    const progress = circumference * displayedAccuracy / 100

    return (
        <div
            role="img"
            aria-label={`${targetAccuracy.toFixed(targetAccuracy % 1 === 0 ? 0 : 1)} percent accuracy`}
            className="relative grid h-[clamp(22rem,42vw,44rem)] w-[clamp(22rem,42vw,44rem)] place-items-center"
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

                {visibleRankMarkers.map(marker => {
                    const tickStart = polarToSvgPoint(180, 180, 153, marker.minAccuracy)
                    const tickEnd = polarToSvgPoint(180, 180, 168, marker.minAccuracy)
                    const label = polarToSvgPoint(180, 180, 190, marker.minAccuracy)
                    const active = displayedAccuracy + 0.001 >= marker.minAccuracy

                    return (
                        <g key={marker.label}>
                            <line
                                x1={tickStart.x}
                                y1={tickStart.y}
                                x2={tickEnd.x}
                                y2={tickEnd.y}
                                stroke="rgba(255,255,255,0.86)"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <text
                                x={label.x}
                                y={label.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill={active ? ring.to : "rgba(255,255,255,0.55)"}
                                fontSize="22"
                                fontWeight="900"
                            >
                                {marker.label}
                            </text>
                        </g>
                    )
                })}
            </svg>

            <div className="text-center text-white">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-white">Accuracy</p>
                <p className="mt-1 text-[clamp(3.5rem,5vw,5.25rem)] font-black leading-none tabular-nums">
                    {Math.round(displayedAccuracy)}%
                </p>
            </div>
        </div>
    )
}
