import type { Deck } from "../../api/decks"
import type { PaletteTheme } from "../../theme/themes"
import FadeIn from "../FadeIn"
import DeckListRow from "./DeckListRow"

interface DeckListViewProps {
    decks: Deck[]
    onPlay: (deck: Deck) => void
    onEdit: (deck: Deck) => void
    onDelete: (deck: Deck) => void
    palette: PaletteTheme
}

export default function DeckListView({ decks, onPlay, onEdit, onDelete, palette }: DeckListViewProps) {
    return (
        <div className="flex flex-col gap-5">
            {decks.map(deck => (
                <FadeIn key={deck.id}>
                    <DeckListRow
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
