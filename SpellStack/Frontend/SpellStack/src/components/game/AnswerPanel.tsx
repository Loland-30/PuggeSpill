import type { RefObject } from "react"

interface AnswerPanelProps {
    promptWord: string
    revealedAnswer: string
    result: "correct" | "incorrect" | null
    input: string
    inputRef: RefObject<HTMLInputElement | null>
    timerPercent: number
    rushActive: boolean
    onInputChange: (value: string) => void
    onSubmit: () => void
}

export default function AnswerPanel({
    promptWord,
    revealedAnswer,
    result,
    input,
    inputRef,
    timerPercent,
    rushActive,
    onInputChange,
    onSubmit
}: AnswerPanelProps) {
    const feedbackWord = result === "correct" ? revealedAnswer : result === "incorrect" ? revealedAnswer : null

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
            <h1 className={`text-5xl font-black transition-all duration-300 sm:text-7xl ${
                result === "correct" ? "text-green-400" :
                result === "incorrect" ? "text-red-400" : "text-white"
            }`}>
                {promptWord}
            </h1>

            <div className="flex h-1.5 w-full max-w-xl justify-center rounded-full bg-white/20">
                <div
                    className={`h-full rounded-full transition-all ${
                        rushActive ? "bg-yellow-300" :
                        timerPercent <= 30 ? "bg-red-400" :
                        timerPercent <= 60 ? "bg-orange-400" : "bg-white"
                    }`}
                    style={{
                        width: `${timerPercent}%`,
                        transitionDuration: rushActive ? "250ms" : "1000ms",
                        boxShadow: rushActive ? "0 0 24px rgba(250, 204, 21, 0.95)" : undefined
                    }}
                />
            </div>

            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={event => onInputChange(event.target.value)}
                onKeyDown={event => event.key === "Enter" && onSubmit()}
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