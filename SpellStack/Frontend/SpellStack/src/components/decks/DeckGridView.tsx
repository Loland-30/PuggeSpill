import type { Deck } from "../../api/decks"
import type { PaletteTheme } from "../../theme/themes"
import FadeIn from "../FadeIn"
import DeckGridCard from "./DeckGridCard"
import { isDeckTrialEligible } from "../../utils/trialRules"

interface DeckGridViewProps {
    decks: Deck[]
    onPlay: (deck: Deck) => void
    onEdit: (deck: Deck) => void
    onDelete: (deck: Deck) => void
    palette: PaletteTheme
    trialModeActive: boolean
}

export default function DeckGridView({ decks, onPlay, onEdit, onDelete, palette, trialModeActive }: DeckGridViewProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:justify-start xl:[grid-template-columns:repeat(auto-fill,minmax(20rem,22rem))]">
            {decks.map(deck => (
                <FadeIn key={deck.id} className="w-full">
                    <DeckGridCard
                        deck={deck}
                        onPlay={() => onPlay(deck)}
                        onEdit={() => onEdit(deck)}
                        onDelete={() => onDelete(deck)}
                        palette={palette}
                        trialLocked={trialModeActive && !isDeckTrialEligible(deck.words.length)}
                    />
                </FadeIn>
            ))}
        </div>
    )
}
