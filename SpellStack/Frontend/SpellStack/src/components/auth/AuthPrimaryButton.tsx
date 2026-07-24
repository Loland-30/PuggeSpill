import { ArrowRight } from "lucide-react"

interface AuthPrimaryButtonProps {
    text: string
    ariaLabel: string
    onClick?: () => void
    type?: "button" | "submit"
    disabled?: boolean
    loading?: boolean
    variant?: "circle" | "pill"
    wide?: boolean
}

const smoothEase = "cubic-bezier(0.22, 1, 0.36, 1)"

export default function AuthPrimaryButton({ text, ariaLabel, onClick, type = "button", disabled = false, loading = false, variant = "circle", wide = false }: AuthPrimaryButtonProps) {
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
            className={`group inline-flex h-14 w-14 items-center justify-center gap-0 overflow-hidden rounded-full bg-white text-slate-950 shadow-[0_0_32px_rgba(255,255,255,0.18)] transition-[width,gap,transform,box-shadow,background-color] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:gap-2.5 focus-visible:gap-2.5 disabled:cursor-not-allowed disabled:opacity-45 max-sm:gap-2.5 ${
                wide
                    ? "hover:w-[10rem] focus-visible:w-[10rem] max-sm:w-[10rem]"
                    : "hover:w-[8.25rem] focus-visible:w-[8.25rem] max-sm:w-[8.25rem]"
            }`}
        >
            <ArrowRight size={24} strokeWidth={2.8} className="shrink-0" />
            <span
                className={`max-w-0 translate-x-[-6px] overflow-hidden whitespace-nowrap text-sm font-black opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 max-sm:translate-x-0 max-sm:opacity-100 ${
                    wide
                        ? "group-hover:max-w-28 group-focus-visible:max-w-28 max-sm:max-w-28"
                        : "group-hover:max-w-20 group-focus-visible:max-w-20 max-sm:max-w-20"
                }`}
                style={{ transition: `max-width 420ms ${smoothEase}, opacity 260ms ease, transform 420ms ${smoothEase}` }}
            >
                {loading ? "Loading" : text}
            </span>
        </button>
    )
}
