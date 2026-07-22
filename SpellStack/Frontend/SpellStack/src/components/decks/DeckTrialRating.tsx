import { Star } from "lucide-react"

import { getDeckTrialStars, type Deck } from "../../api/decks"
import { useI18n } from "../../i18n/I18nContext"
import type { PaletteTheme } from "../../theme/themes"
import { TRIAL_MAXIMUM_STARS } from "../../utils/trialRules"

interface DeckTrialRatingProps {
    deck: Deck
    palette: PaletteTheme
    size?: number
}

export default function DeckTrialRating({ deck, palette, size = 18 }: DeckTrialRatingProps) {
    const { t } = useI18n()
    const stars = getDeckTrialStars(deck)
    const label = t.trials.ratingLabel
        .replace("{stars}", String(stars))
        .replace("{maximum}", String(TRIAL_MAXIMUM_STARS))

    return (
        <span className="inline-flex items-center gap-0.5" aria-label={label} title={label}>
            {Array.from({ length: TRIAL_MAXIMUM_STARS }, (_, index) => {
                const filled = index < stars
                return (
                    <Star
                        key={index}
                        size={size}
                        fill={filled ? "currentColor" : "none"}
                        aria-hidden="true"
                        className={filled ? palette.accentText : "text-white/25"}
                    />
                )
            })}
        </span>
    )
}
