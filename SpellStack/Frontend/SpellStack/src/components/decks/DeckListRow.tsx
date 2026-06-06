import { Pencil, Trash2 } from "lucide-react"

import type { Deck } from "../../api/decks"
import { useUISound } from "../../audio/useUISound"
import { languages } from "../../data/languages"
import { useI18n } from "../../i18n/I18nContext"
import type { PaletteTheme } from "../../theme/themes"
import GradientFrame from "../GradientFrame"

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
                contentClassName="relative min-h-24 overflow-hidden rounded-[inherit] px-8 py-5"
            >
                <div className="grid w-full max-w-[38rem] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4">
                    <div className="min-w-0">
                        <h2 className="truncate text-3xl font-black" title={deck.name}>{deck.name}</h2>
                        <p className="mt-1 text-sm font-semibold text-white/80">
                            {t.deckPage.wordCount}: {deck.words.length}
                        </p>
                        <p className="text-xs text-white/50">
                            {t.deckPage.highscore}: {deck.highScore}
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                        <img
                            src={getLanguageFlag(deck.language)}
                            alt={`${deck.language} flag`}
                            className="h-11 w-16 rounded-lg object-cover"
                        />
                        <img
                            src={getLanguageFlag(deck.translationLanguage)}
                            alt={`${deck.translationLanguage} flag`}
                            className="h-11 w-16 rounded-lg object-cover"
                        />
                    </div>

                    <button
                        onClick={onPlay}
                        onMouseEnter={playHoverSound}
                        className={`rounded-full px-5 py-2 text-sm font-black ${palette.primaryButtonText} opacity-100 shadow-lg transition ${palette.primaryButton}`}
                    >
                        {t.common.play}
                    </button>
                </div>

                <div className="pointer-events-none absolute right-5 top-1/2 flex w-40 -translate-y-1/2 items-center gap-3 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
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
