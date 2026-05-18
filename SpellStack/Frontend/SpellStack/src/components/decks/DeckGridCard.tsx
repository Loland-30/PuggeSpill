import type { KeyboardEvent, MouseEvent } from "react"
import { Pencil, Trash2, Trophy } from "lucide-react"

import type { Deck } from "../../api/decks"
import { languages } from "../../data/languages"
import { useI18n } from "../../i18n/I18nContext"
import type { PaletteTheme } from "../../theme/themes"
import GradientFrame from "../GradientFrame"

interface DeckGridCardProps {
    deck: Deck
    onPlay: () => void
    onEdit: () => void
    onDelete: () => void
    palette: PaletteTheme
}

function getLanguage(code: string) {
    return languages.find(language => language.code === code)
}

function formatScore(score: number) {
    return score.toLocaleString("nb-NO")
}

export default function DeckGridCard({ deck, onPlay, onEdit, onDelete, palette }: DeckGridCardProps) {
    const { t } = useI18n()
    const sourceLanguage = getLanguage(deck.language)
    const translationLanguage = getLanguage(deck.translationLanguage)
    const sourceIsLearning = deck.language === deck.learningLanguage
    const translationIsLearning = deck.translationLanguage === deck.learningLanguage

    const handleActionClick = (event: MouseEvent<HTMLButtonElement>, action: () => void) => {
        event.stopPropagation()
        action()
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onPlay()
        }
    }

    return (
        <GradientFrame
            glow
            radius={24}
            radiusClass="rounded-3xl"
            className="group h-full rounded-3xl transition duration-300 hover:-translate-y-1"
            contentClassName="h-full rounded-[inherit] px-4 py-4"
            hoverFillClassName="group-hover/gradient-frame:bg-black/30"
        >
            <div
                role="button"
                tabIndex={0}
                onClick={onPlay}
                onKeyDown={handleKeyDown}
                className="relative flex h-full min-h-40 cursor-pointer flex-col overflow-hidden outline-none"
                aria-label={`${t.common.play} ${deck.name}`}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-wrap items-start gap-4">
                        <FlagBlock
                            name={sourceLanguage?.label ?? deck.language}
                            flagUrl={sourceLanguage?.flagUrl}
                            learning={sourceIsLearning}
                            learningLabel={t.deckPage.learning}
                        />
                        <FlagBlock
                            name={translationLanguage?.label ?? deck.translationLanguage}
                            flagUrl={translationLanguage?.flagUrl}
                            learning={translationIsLearning}
                            learningLabel={t.deckPage.learning}
                        />
                    </div>

                    <div className="flex shrink-0 items-start gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                        <button
                            type="button"
                            onClick={event => handleActionClick(event, onEdit)}
                            className="flex h-12 w-10 flex-col items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
                            aria-label={`${t.common.edit} ${deck.name}`}
                        >
                            <Pencil size={20} strokeWidth={2.5} />
                            <span className="mt-1 text-[11px] font-semibold">{t.common.edit}</span>
                        </button>

                        <button
                            type="button"
                            onClick={event => handleActionClick(event, onDelete)}
                            className="flex h-12 w-12 flex-col items-center justify-center rounded-lg text-white/80 transition hover:bg-red-500/25 hover:text-white"
                            aria-label={`${t.common.delete} ${deck.name}`}
                        >
                            <Trash2 size={20} strokeWidth={2.5} />
                            <span className="mt-1 text-[11px] font-semibold">{t.common.delete}</span>
                        </button>
                    </div>
                </div>

                <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 pt-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-2xl font-black text-white" title={deck.name}>{deck.name}</h2>
                        <div className="mt-2 flex items-center gap-2 text-base font-semibold text-white/80">
                            <Trophy size={22} strokeWidth={2.8} className={palette.accentText} />
                            <span>{formatScore(deck.highScore)}</span>
                        </div>
                    </div>

                    <div className="text-right leading-none">
                        <p className="text-5xl font-black text-white drop-shadow-sm">{deck.words.length}</p>
                        <p className="mt-1 text-sm font-semibold text-white/70">{t.deckPage.words}</p>
                    </div>
                </div>
            </div>
        </GradientFrame>
    )
}

function FlagBlock({ name, flagUrl, learning, learningLabel }: { name: string; flagUrl?: string; learning: boolean; learningLabel: string }) {
    return (
        <div className="min-w-0">
            {flagUrl ? (
                <img
                    src={flagUrl}
                    alt={`${name} flag`}
                    className="h-12 w-20 rounded-2xl object-cover shadow-lg"
                />
            ) : (
                <div className="h-12 w-20 rounded-2xl bg-white/15" />
            )}

            <p className={`mt-1.5 text-center text-xs font-bold ${learning ? "text-white" : "text-transparent"}`}>
                {learningLabel}
            </p>
        </div>
    )
}