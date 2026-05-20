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
            className="group inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white text-slate-950 shadow-[0_0_32px_rgba(255,255,255,0.18)] transition-all duration-300 hover:w-36 hover:gap-3 disabled:cursor-not-allowed disabled:opacity-45 max-sm:w-36 max-sm:gap-3"
        >
            <ArrowRight size={25} strokeWidth={3} className="shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-black opacity-0 transition-all duration-300 group-hover:max-w-20 group-hover:opacity-100 max-sm:max-w-20 max-sm:opacity-100">
                {loading ? "Loading" : text}
            </span>
        </button>
    )
}
