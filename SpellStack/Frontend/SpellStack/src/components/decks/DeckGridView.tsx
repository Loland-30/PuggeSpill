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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {decks.map(deck => (
                <FadeIn key={deck.id}>
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
