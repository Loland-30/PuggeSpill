import { ArrowLeft } from "lucide-react"

interface AuthBackButtonProps {
    onClick: () => void
    ariaLabel?: string
}

export default function AuthBackButton({ onClick, ariaLabel = "Back" }: AuthBackButtonProps) {
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
