import type { FormEvent } from "react"

interface TrialQuestionCardProps {
    title: string
    source: string
    answer: string
    onAnswerChange: (value: string) => void
    onSubmit: () => void
}

export default function TrialQuestionCard({
    title,
    source,
    answer,
    onAnswerChange,
    onSubmit
}: TrialQuestionCardProps) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        onSubmit()
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-xl sm:rounded-3xl sm:p-8"
        >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">
                {title}
            </p>

            <h1 className="mt-5 break-words text-4xl font-black text-gray-800 sm:mt-6 sm:text-6xl">
                {source}
            </h1>

            <input
                type="text"
                value={answer}
                onChange={event => onAnswerChange(event.target.value)}
                autoFocus
                placeholder="Type answer..."
                className="mt-10 w-full border-b-2 border-gray-200 bg-transparent py-4 text-center text-2xl font-semibold text-gray-800 outline-none transition focus:border-orange-400 placeholder:text-gray-300"
            />

            <button
                type="submit"
                className="mt-8 rounded-full bg-orange-400 px-10 py-3 font-bold text-white shadow-lg transition hover:bg-orange-500"
            >
                Next
            </button>
        </form>
    )
}
