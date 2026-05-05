interface Props {
    lives: number
    maxLives: number
}

export default function LivesDisplay({ lives, maxLives }: Props) {
    return (
        <div className="flex gap-2" aria-label={`${lives} lives left`}>
            {Array.from({ length: maxLives }).map((_, i) => (
                <span
                    key={i}
                    className={`text-2xl leading-none transition-all duration-300 ${
                        i < lives ? "text-red-400 scale-100" : "text-gray-200 scale-90"
                    }`}
                    aria-hidden="true"
                >
                    &hearts;
                </span>
            ))}
        </div>
    )
}
