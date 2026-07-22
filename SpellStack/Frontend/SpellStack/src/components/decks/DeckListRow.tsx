import { Pencil, Trash2 } from "lucide-react"

import type { Deck } from "../../api/decks"
import { useUISound } from "../../audio/useUISound"
import { languages } from "../../data/languages"
import { useI18n } from "../../i18n/I18nContext"
import type { PaletteTheme } from "../../theme/themes"
import GradientFrame from "../GradientFrame"
import DeckTrialRating from "./DeckTrialRating"

interface DeckListRowProps {
    deck: Deck
    onPlay: () => void
    onEdit: () => void
    onDelete: () => void
    palette: PaletteTheme
}

function getLanguageFlag(code: string) {
    return languages.find(language => language.code === code)?.flagUrl
}

export default function DeckListRow({ deck, onPlay, onEdit, onDelete, palette }: DeckListRowProps) {
    const { t } = useI18n()
    const { playHoverSound } = useUISound()

    return (
        <div className="mx-auto w-full max-w-2xl overflow-visible lg:w-[52rem] lg:max-w-none">
            <GradientFrame
                glow
                radius={28}
                radiusClass="rounded-[28px]"
                className="group w-full max-w-2xl rounded-[28px] transition-all duration-300 lg:hover:max-w-[52rem]"
                contentClassName="relative min-h-24 overflow-hidden rounded-[inherit] px-4 py-4 sm:px-8 sm:py-5"
            >
                <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:max-w-[38rem] lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-4">
                    <div className="min-w-0">
                        <h2 className="line-clamp-2 break-words text-xl font-black sm:text-2xl lg:truncate lg:text-3xl" title={deck.name}>{deck.name}</h2>
                        <p className="mt-1 text-sm font-semibold text-white/80">
                            {t.deckPage.wordCount}: {deck.words.length}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            <span>{t.deckPage.highscore}: {deck.highScore}</span>
                            <DeckTrialRating deck={deck} palette={palette} size={15} />
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                        <img
                            src={getLanguageFlag(deck.language)}
                            alt={`${deck.language} flag`}
                            className="h-8 w-11 rounded-md object-cover sm:h-11 sm:w-16 sm:rounded-lg"
                        />
                        <img
                            src={getLanguageFlag(deck.translationLanguage)}
                            alt={`${deck.translationLanguage} flag`}
                            className="h-8 w-11 rounded-md object-cover sm:h-11 sm:w-16 sm:rounded-lg"
                        />
                    </div>

                    <button
                        onClick={onPlay}
                        onMouseEnter={playHoverSound}
                        className={`col-span-2 min-h-11 rounded-full px-5 py-2 text-sm font-black lg:col-span-1 ${palette.primaryButtonText} opacity-100 shadow-lg transition ${palette.primaryButton}`}
                    >
                        {t.common.play}
                    </button>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/10 pt-2 lg:pointer-events-none lg:absolute lg:right-5 lg:top-1/2 lg:mt-0 lg:w-40 lg:-translate-y-1/2 lg:border-0 lg:pt-0 lg:opacity-0 lg:transition-opacity lg:duration-300 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100 lg:group-focus-within:pointer-events-auto lg:group-focus-within:opacity-100">
                    <button
                        onClick={onEdit}
                        onMouseEnter={playHoverSound}
                        className="flex h-14 w-16 flex-col items-center justify-center rounded-lg text-white transition hover:bg-white/10"
                        aria-label={`${t.common.edit} ${deck.name}`}
                    >
                        <Pencil size={27} strokeWidth={2.5} />
                        <span className="mt-1 text-xs font-bold">{t.common.edit}</span>
                    </button>

                    <button
                        onClick={onDelete}
                        onMouseEnter={playHoverSound}
                        className="flex h-14 w-16 flex-col items-center justify-center rounded-lg text-white transition hover:bg-red-500/30"
                        aria-label={`${t.common.delete} ${deck.name}`}
                    >
                        <Trash2 size={27} strokeWidth={2.5} />
                        <span className="mt-1 text-xs font-bold">{t.common.delete}</span>
                    </button>
                </div>
            </GradientFrame>
        </div>
    )
}
