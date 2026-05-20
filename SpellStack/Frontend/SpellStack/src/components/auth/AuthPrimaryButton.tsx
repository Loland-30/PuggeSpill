import { ArrowRight } from "lucide-react"

interface AuthPrimaryButtonProps {
    text: string
    ariaLabel: string
    onClick?: () => void
    type?: "button" | "submit"
    disabled?: boolean
    loading?: boolean
    variant?: "circle" | "pill"
}

const smoothEase = "cubic-bezier(0.22, 1, 0.36, 1)"

export default function AuthPrimaryButton({ text, ariaLabel, onClick, type = "button", disabled = false, loading = false, variant = "circle" }: AuthPrimaryButtonProps) {
    if (variant === "pill") {
        return (
            <button
                type={type}
                onClick={onClick}
                disabled={disabled || loading}
                aria-label={ariaLabel}
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-9 text-base font-black text-slate-950 shadow-[0_0_32px_rgba(255,255,255,0.18)] transition hover:-translate-y-0.5 hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-45"
            >
                {loading ? "Loading..." : text}
            </button>
        )
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            aria-label={ariaLabel}
            className="group inline-flex h-14 w-14 items-center justify-center gap-0 overflow-hidden rounded-full bg-white text-slate-950 shadow-[0_0_32px_rgba(255,255,255,0.18)] transition-[width,gap,transform,box-shadow,background-color] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-[8.25rem] hover:gap-2.5 focus-visible:w-[8.25rem] focus-visible:gap-2.5 disabled:cursor-not-allowed disabled:opacity-45 max-sm:w-[8.25rem] max-sm:gap-2.5"
        >
            <ArrowRight size={24} strokeWidth={2.8} className="shrink-0" />
            <span
                className="max-w-0 translate-x-[-6px] overflow-hidden whitespace-nowrap text-sm font-black opacity-0 group-hover:max-w-20 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:max-w-20 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 max-sm:max-w-20 max-sm:translate-x-0 max-sm:opacity-100"
                style={{ transition: `max-width 240ms ${smoothEase}, opacity 160ms ease, transform 240ms ${smoothEase}` }}
            >
                {loading ? "Loading" : text}
            </span>
        </button>
    )
}
