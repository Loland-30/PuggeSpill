import type { Deck } from "../../api/decks"
import type { PaletteTheme } from "../../theme/themes"
import FadeIn from "../FadeIn"
import DeckGridCard from "./DeckGridCard"

interface DeckGridViewProps {
    decks: Deck[]
    onPlay: (deck: Deck) => void
    onEdit: (deck: Deck) => void
    onDelete: (deck: Deck) => void
    palette: PaletteTheme
}

export default function DeckGridView({ decks, onPlay, onEdit, onDelete, palette }: DeckGridViewProps) {
    return (
        <div className="grid justify-start gap-5 [grid-template-columns:repeat(auto-fit,minmax(18rem,22rem))]">
            {decks.map(deck => (
                <FadeIn key={deck.id} className="w-full">
                    <DeckGridCard
                        deck={deck}
                        onPlay={() => onPlay(deck)}
                        onEdit={() => onEdit(deck)}
                        onDelete={() => onDelete(deck)}
                        palette={palette}
                    />
                </FadeIn>
            ))}
        </div>
    )
}
