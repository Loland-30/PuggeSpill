import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react"

import { getDecks, deleteDeck, type Deck } from "../api/decks"
import type { ActiveGameModifier, GameDirection, RoundLimit } from "../api/gameSession"
import { languages } from "../data/languages"
import FadeIn from "../components/FadeIn"
import GameModeModal from "../components/GameModeModal"
import { useAuth } from "../auth/AuthContext"
import { useTheme } from "../theme/ThemeContext"
import PageContentTransition from "../components/PageContentTransition"
import GradientFrame from "../components/GradientFrame"
import LibraryViewPicker, { type LibraryView } from "../components/LibraryViewPicker"
import DeckFilterBar, { type DeckLengthFilter, type DeckSortOption } from "../components/decks/DeckFilterBar"

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
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState("all")
    const [selectedLength, setSelectedLength] = useState<DeckLengthFilter>("any")
    const [selectedSort, setSelectedSort] = useState<DeckSortOption>("newest")

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

    const activeFilterCount = [
        selectedLanguage !== "all",
        selectedLength !== "any",
        selectedSort !== "newest"
    ].filter(Boolean).length

    const filteredDecks = useMemo(() => {
        const matchesLength = (deck: Deck) => {
            const wordCount = deck.words.length

            if (selectedLength === "short") return wordCount >= 1 && wordCount <= 20
            if (selectedLength === "medium") return wordCount >= 21 && wordCount <= 50
            if (selectedLength === "long") return wordCount >= 51
            return true
        }

        const nextDecks = decks.filter(deck =>
            (selectedLanguage === "all" || deck.learningLanguage === selectedLanguage) &&
            matchesLength(deck)
        )

        if (selectedSort === "name-asc") {
            return [...nextDecks].sort((a, b) => a.name.localeCompare(b.name))
        }

        if (selectedSort === "most-words") {
            return [...nextDecks].sort((a, b) => b.words.length - a.words.length)
        }

        if (selectedSort === "fewest-words") {
            return [...nextDecks].sort((a, b) => a.words.length - b.words.length)
        }

        return nextDecks
    }, [decks, selectedLanguage, selectedLength, selectedSort])

    const resetFilters = () => {
        setSelectedLanguage("all")
        setSelectedLength("any")
        setSelectedSort("newest")
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
                                onClick={() => setIsFilterOpen(isOpen => !isOpen)}
                                className={`group relative flex h-12 items-center justify-center overflow-hidden rounded-full px-0 text-xs font-bold shadow-lg transition-[width,box-shadow] duration-300 ease-out ${palette.primaryButton} ${isFilterOpen ? `${activeFilterCount > 0 ? "w-28" : "w-24"} ${palette.glow}` : `${activeFilterCount > 0 ? "hover:w-28" : "hover:w-24"} w-12`}`}
                                aria-expanded={isFilterOpen}
                                aria-label="Toggle filters"
                            >
                                <SlidersHorizontal size={20} strokeWidth={2.6} className="shrink-0" />
                                <span className={`whitespace-nowrap transition-all duration-300 ease-out ${isFilterOpen ? `${activeFilterCount > 0 ? "max-w-24" : "max-w-16"} ml-2 opacity-100` : `ml-0 max-w-0 opacity-0 group-hover:ml-2 ${activeFilterCount > 0 ? "group-hover:max-w-24" : "group-hover:max-w-16"} group-hover:opacity-100`}`}>
                                    Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div
                        className={`relative z-[1000] transition-[max-height,opacity,transform] duration-300 ease-out ${isFilterOpen ? "max-h-40 translate-y-0 overflow-visible opacity-100" : "pointer-events-none max-h-0 -translate-y-3 overflow-hidden opacity-0"}`}
                        aria-hidden={!isFilterOpen}
                    >
                        <DeckFilterBar
                            selectedLanguage={selectedLanguage}
                            onLanguageChange={setSelectedLanguage}
                            selectedLength={selectedLength}
                            onLengthChange={setSelectedLength}
                            selectedSort={selectedSort}
                            onSortChange={setSelectedSort}
                            onReset={resetFilters}
                            canReset={activeFilterCount > 0}
                            palette={palette}
                        />
                    </div>

                    <PageContentTransition className="relative z-0">
                        {filteredDecks.length === 0 ? (
                        <FadeIn>
                            <GradientFrame
                                glow
                                contentClassName="p-10 text-center"
                            >
                                <p className="text-2xl font-black">{decks.length === 0 ? "No decks yet" : "No decks match filters"}</p>
                                <p className="mt-2 text-white/70">{decks.length === 0 ? "Create your first deck to get started" : "Try resetting or changing your filters"}</p>

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
                            {filteredDecks.map(deck => (
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
                            Deck count: {filteredDecks.length}
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
                </div>

                <div className="pointer-events-none absolute right-5 top-1/2 flex w-40 -translate-y-1/2 items-center gap-3 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
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
