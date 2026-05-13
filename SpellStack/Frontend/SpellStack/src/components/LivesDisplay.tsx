interface Props {
    lives: number
    maxLives: number
    size?: "default" | "large"
    className?: string
}

export default function LivesDisplay({ lives, maxLives, size = "default", className = "" }: Props) {
    const sizeClass = size === "large"
        ? "text-4xl drop-shadow-[0_0_10px_rgba(248,113,113,0.45)] sm:text-5xl"
        : "text-2xl"

    return (
        <div className={`flex gap-3 ${className}`} aria-label={`${lives} lives left`}>
            {Array.from({ length: maxLives }).map((_, i) => (
                <span
                    key={i}
                    className={`${sizeClass} leading-none transition-all duration-300 ${
                        i < lives ? "scale-100 text-red-500" : "scale-90 text-white/15"
                    }`}
                    aria-hidden="true"
                >
                    &hearts;
                </span>
            ))}
        </div>
    )
}