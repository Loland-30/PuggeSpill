import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react"

interface FadeInProps {
    children: ReactNode
    className?: string
    delayMs?: number
    durationMs?: number
}

function randomBetween(min: number, max: number) {
    return Math.round(min + Math.random() * (max - min))
}

export default function FadeIn({ children, className = "", delayMs, durationMs }: FadeInProps) {
    const [visible, setVisible] = useState(false)
    const timing = useMemo(() => ({
        delay: delayMs ?? randomBetween(0, 180),
        duration: durationMs ?? randomBetween(300, 500)
    }), [delayMs, durationMs])

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (prefersReducedMotion) {
            setVisible(true)
            return
        }

        const timer = window.setTimeout(() => setVisible(true), timing.delay)
        return () => window.clearTimeout(timer)
    }, [timing.delay])

    const style: CSSProperties = {
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.9)",
        transition: `opacity ${timing.duration}ms ease-out, transform ${timing.duration}ms ease-out`,
        transformOrigin: "center"
    }

    return (
        <div className={className} style={style}>
            {children}
        </div>
    )
}
