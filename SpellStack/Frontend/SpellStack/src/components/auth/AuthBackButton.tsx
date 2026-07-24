import { ArrowLeft } from "lucide-react"

interface AuthBackButtonProps {
    onClick: () => void
    ariaLabel?: string
    text?: string
}

const smoothEase = "cubic-bezier(0.22, 1, 0.36, 1)"

export default function AuthBackButton({ onClick, ariaLabel = "Back", text }: AuthBackButtonProps) {
    if (text) {
        return (
            <button
                type="button"
                onClick={onClick}
                aria-label={ariaLabel}
                className="group inline-flex h-14 w-14 items-center justify-center gap-0 overflow-hidden rounded-full bg-white text-slate-950 shadow-[0_0_32px_rgba(255,255,255,0.18)] transition-[width,gap,transform,box-shadow,background-color] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-[10rem] hover:gap-2.5 focus-visible:w-[10rem] focus-visible:gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
                <ArrowLeft size={24} strokeWidth={2.8} className="shrink-0" />
                <span
                    className="max-w-0 translate-x-1.5 overflow-hidden whitespace-nowrap text-sm font-black opacity-0 group-hover:max-w-28 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:max-w-28 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                    style={{ transition: `max-width 420ms ${smoothEase}, opacity 260ms ease, transform 420ms ${smoothEase}` }}
                >
                    {text}
                </span>
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className="grid h-14 w-14 place-items-center rounded-full bg-white text-slate-950 shadow-[0_0_32px_rgba(255,255,255,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/92 focus:outline-none focus:ring-2 focus:ring-white/70"
        >
            <ArrowLeft size={24} strokeWidth={2.8} />
        </button>
    )
}
