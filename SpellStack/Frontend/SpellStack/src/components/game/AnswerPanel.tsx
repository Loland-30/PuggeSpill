import { useEffect, useRef, useState, type RefObject } from "react"

interface AnswerPanelProps {
    promptWord: string
    revealedAnswer: string
    result: "correct" | "incorrect" | null
    resetKey: string | number
    hiddenModifierActive: boolean
    inputRef: RefObject<HTMLInputElement | null>
    timerDuration: number
    timerInitialTimeLeft: number
    timerResetKey: string | number
    timerHidden: boolean
    timerTickMs: number
    timerRunning: boolean
    rushActive: boolean
    onTimerTick: (timeLeft: number) => void
    onTimeout: () => void
    onSubmitAnswer: (answer: string) => void
}

export default function AnswerPanel({
    promptWord,
    revealedAnswer,
    result,
    resetKey,
    hiddenModifierActive,
    inputRef,
    timerDuration,
    timerInitialTimeLeft,
    timerResetKey,
    timerHidden,
    timerTickMs,
    timerRunning,
    rushActive,
    onTimerTick,
    onTimeout,
    onSubmitAnswer
}: AnswerPanelProps) {

    const [input, setInput] = useState("")
    const [timeLeft, setTimeLeft] = useState(timerInitialTimeLeft)
    const [promptHidden, setPromptHidden] = useState(false)
    const onTimerTickRef = useRef(onTimerTick)
    const onTimeoutRef = useRef(onTimeout)
    const timedOutRef = useRef(false)
    const feedbackWord = result === "correct" ? revealedAnswer : result === "incorrect" ? revealedAnswer : null
    const timerScale = Math.max(0, Math.min(1, timeLeft / timerDuration))

    useEffect(() => {
        onTimerTickRef.current = onTimerTick
    }, [onTimerTick])

    useEffect(() => {
        onTimeoutRef.current = onTimeout
    }, [onTimeout])

    useEffect(() => {
        setInput("")
        setPromptHidden(false)
    }, [resetKey])

    useEffect(() => {
        if (!hiddenModifierActive || !timerRunning || result) {
            setPromptHidden(false)
            return
        }

        const timeout = window.setTimeout(() => {
            setPromptHidden(true)
        }, 1400)

        return () => window.clearTimeout(timeout)
    }, [hiddenModifierActive, resetKey, result, timerRunning])

    useEffect(() => {
        const nextTimeLeft = timerInitialTimeLeft

        timedOutRef.current = false
        setTimeLeft(nextTimeLeft)
        onTimerTickRef.current(nextTimeLeft)
    }, [timerInitialTimeLeft, timerResetKey])

    useEffect(() => {
        if (!timerRunning) return

        const interval = window.setInterval(() => {
            setTimeLeft(prev => {
                const nextTimeLeft = Math.max(0, prev - 1)
                onTimerTickRef.current(nextTimeLeft)

                if (nextTimeLeft <= 0 && !timedOutRef.current) {
                    timedOutRef.current = true
                    window.setTimeout(() => onTimeoutRef.current(), 0)
                }

                return nextTimeLeft
            })
        }, timerTickMs)

        return () => window.clearInterval(interval)
    }, [timerRunning, timerTickMs])

    const submitAnswer = () => {
        if (result) return

        onSubmitAnswer(input)
        setInput("")
    }

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
            <h1 className={`text-5xl font-black transition-all duration-300 sm:text-7xl ${
                result === "correct" ? "text-green-400" :
                result === "incorrect" ? "text-red-400" :
                promptHidden ? "select-none text-transparent opacity-0 blur-md" : "text-white"
            }`}>
                {promptWord}
            </h1>

            {hiddenModifierActive && !result && (
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/45">
                    Hidden {promptHidden ? "- recall the question" : "- memorize"}
                </span>
            )}

            <div className="flex min-h-6 w-full max-w-xl items-center justify-center">
                {timerHidden ? (
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/45">
                        No Time
                    </span>
                ) : (
                    <div className="flex h-1.5 w-full justify-center rounded-full bg-white/20">
                        <div
                            className={`h-full w-full origin-center rounded-full transition-transform ${
                                rushActive ? "bg-yellow-300" :
                                timerScale <= 0.3 ? "bg-red-400" :
                                timerScale <= 0.6 ? "bg-orange-400" : "bg-white"
                            }`}
                            style={{
                                transform: `scaleX(${timerScale})`,
                                transitionDuration: rushActive ? "250ms" : `${Math.max(120, timerTickMs)}ms`,
                                boxShadow: rushActive ? "0 0 24px rgba(250, 204, 21, 0.95)" : undefined
                            }}
                        />
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => event.key === "Enter" && submitAnswer()}
                disabled={!!result}
                placeholder="Type translation..."
                autoFocus
                className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-4 text-center text-3xl font-semibold tracking-wide text-white shadow-[inset_0_0_24px_rgba(255,255,255,0.035)] outline-none backdrop-blur-sm transition placeholder:text-white/20 focus:border-white/45 focus:bg-white/[0.075] focus:shadow-[0_0_28px_rgba(255,255,255,0.12),inset_0_0_24px_rgba(255,255,255,0.04)] disabled:opacity-60 sm:text-4xl"
            />

            <div className="min-h-8">
                {feedbackWord && (
                    <p className={`text-3xl font-black ${result === "correct" ? "text-green-400" : "text-white/75"}`}>
                        {feedbackWord}
                    </p>
                )}
            </div>
        </section>
    )
}
