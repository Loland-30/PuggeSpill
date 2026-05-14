import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"

import { getDecks, deleteDeck, type Deck } from "../api/decks"
import type { ActiveGameModifier, GameDirection, RoundLimit } from "../api/gameSession"
import { languages } from "../data/languages"
import FadeIn from "../components/FadeIn"
import GameModeModal from "../components/GameModeModal"
import { useAuth } from "../auth/AuthContext"
import { useTheme } from "../theme/ThemeContext"
import PageContentTransition from "../components/PageContentTransition"
import GradientFrame from "../components/GradientFrame"
import ProfileDropdown from "../components/ProfileDropdown"
import LibraryViewPicker, { type LibraryView } from "../components/LibraryViewPicker"

function getLanguageFlag(code: string) {
    return languages.find(language => language.code === code)?.flagUrl
}

export default function DeckPage() {
    const navigate = useNavigate()
    const { user, loading: authLoading } = useAuth()
    const { palette } = useTheme()
    const [decks, setDecks] = useState<Deck[]>([])
    const [, setLoading] = useState(true)
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)

    useEffect(() => {
        if (authLoading) return

        if (!user) {
            navigate("/login")
            return
        }

        getDecks().then(data => {
            setDecks(data)
            setLoading(false)
        })
    }, [authLoading, user, navigate])

    const handleDelete = async (id: number) => {
        await deleteDeck(id)
        setDecks(currentDecks => currentDecks.filter(deck => deck.id !== id))
    }

    const handlePlay = (deck: Deck) => {
        setSelectedDeck(deck)
    }

    const handleLibraryViewChange = (view: LibraryView) => {
        if (view === "trials") navigate("/trials")
    }

    const handleModeSelect = (direction: GameDirection, modifiers: ActiveGameModifier[], roundLimit: RoundLimit) => {
        const params = new URLSearchParams({ direction })

        if (modifiers.length > 0) {
            params.set("mods", modifiers.join(","))
        }

        params.set("roundLimit", roundLimit === null ? "endless" : String(roundLimit))

        navigate(`/decks/${selectedDeck!.id}/play?${params.toString()}`)
    }


    return (
        <>
            <GameModeModal
                isOpen={selectedDeck !== null}
                deck={selectedDeck!}
                onSelect={handleModeSelect}
                onClose={() => setSelectedDeck(null)}
            />

            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[102rem] flex-col">
                <div className="flex justify-end">
                    <ProfileDropdown />
                </div>

                <main className="mx-auto mt-14 flex w-full max-w-3xl flex-1 flex-col">
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                        <LibraryViewPicker
                            activeView="decks"
                            onChange={handleLibraryViewChange}
                        />

                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate("/decks/create")}
                                className={`grid h-12 w-12 place-items-center rounded-full text-3xl font-black shadow-lg transition ${palette.primaryButton}`}
                                aria-label="Create deck"
                            >
                                <Plus size={28} strokeWidth={3} />
                            </button>

                            <button
                                className={`flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold shadow-lg transition ${palette.primaryButton}`}
                            >
                                <Search size={20} strokeWidth={2.6} />
                                Filter
                            </button>
                        </div>
                    </div>

                    <PageContentTransition>
                        {decks.length === 0 ? (
                        <FadeIn>
                            <GradientFrame
                                glow
                                contentClassName="p-10 text-center"
                            >
                                <p className="text-2xl font-black">No decks yet</p>
                                <p className="mt-2 text-white/70">Create your first deck to get started</p>

                                <button
                                    onClick={() => navigate("/decks/create")}
                                    className={`mt-6 rounded-full px-7 py-3 font-bold text-white transition ${palette.primaryButton}`}
                                >
                                    Create deck
                                </button>
                            </GradientFrame>
                        </FadeIn>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {decks.map(deck => (
                                <FadeIn key={deck.id}>
                                    <DeckRow
                                        deck={deck}
                                        onPlay={() => handlePlay(deck)}
                                        onEdit={() => navigate(`/decks/${deck.id}/edit`)}
                                        onDelete={() => handleDelete(deck.id)}
                                        palette={palette}
                                    />
                                </FadeIn>
                            ))}
                        </div>
                    )}

                        <FadeIn className="mt-auto pb-16 pt-10 text-center text-lg text-white/80">
                            Deck count: {decks.length}
                        </FadeIn>
                    </PageContentTransition>
                </main>
            </div>
        </>
    )
}

function DeckRow({ deck, onPlay, onEdit, onDelete, palette }: {
    deck: Deck
    onPlay: () => void
    onEdit: () => void
    onDelete: () => void
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    return (
        <div className="mx-auto w-full max-w-[42rem] overflow-visible">
            <GradientFrame
                glow
                radius={28}
                radiusClass="rounded-[28px]"
                className="group w-full max-w-xl rounded-[28px] transition-all duration-300 hover:max-w-[42rem]"
                contentClassName="grid min-h-24 grid-cols-[minmax(0,1fr)_auto_auto_0rem] items-center gap-4 overflow-hidden rounded-[inherit] px-8 py-5 transition-all duration-300 group-hover:grid-cols-[minmax(0,1fr)_auto_auto_10rem]"
            >
                <div className="min-w-0">
                    <h2 className="truncate text-3xl font-black">{deck.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-white/80">
                        Word count: {deck.words.length}
                    </p>
                    <p className="text-xs text-white/50">
                        Highscore: {deck.highScore}
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
                    className={`rounded-full px-5 py-2 text-sm font-black text-white opacity-100 shadow-lg transition ${palette.primaryButton}`}
                >
                    Play
                </button>

                <div className="flex w-40 items-center gap-3 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <button
                        onClick={onEdit}
                        className="flex h-14 w-16 flex-col items-center justify-center rounded-lg text-white transition hover:bg-white/10"
                        aria-label={`Edit ${deck.name}`}
                    >
                        <Pencil size={27} strokeWidth={2.5} />
                        <span className="mt-1 text-xs font-bold">Edit</span>
                    </button>

                    <button
                        onClick={onDelete}
                        className="flex h-14 w-16 flex-col items-center justify-center rounded-lg text-white transition hover:bg-red-500/30"
                        aria-label={`Delete ${deck.name}`}
                    >
                        <Trash2 size={27} strokeWidth={2.5} />
                        <span className="mt-1 text-xs font-bold">Delete</span>
                    </button>
                </div>
            </GradientFrame>
        </div>
    )
}
