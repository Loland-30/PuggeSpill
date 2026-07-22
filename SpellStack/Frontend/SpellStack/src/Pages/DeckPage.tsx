import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { GraduationCap, Plus, SlidersHorizontal } from "lucide-react"

import { getDecks, deleteDeck, type Deck } from "../api/decks"
import type { ActiveGameModifier, GameDirection, RoundLimit } from "../api/gameSession"
import FadeIn from "../components/FadeIn"
import GameModeModal from "../components/GameModeModal"
import { useAuth } from "../auth/AuthContext"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"
import GradientFrame from "../components/GradientFrame"
import AppPageShell from "../components/layout/AppPageShell"
import LibraryPageToolbar from "../components/navigation/LibraryPageToolbar"
import DeckFilterBar, { type DeckLengthFilter, type DeckSortOption } from "../components/decks/DeckFilterBar"
import DeckGridView from "../components/decks/DeckGridView"
import DeckListView from "../components/decks/DeckListView"
import DeckViewToggle, { type DeckViewMode } from "../components/decks/DeckViewToggle"
import useMediaQuery from "../hooks/useMediaQuery"

const deckViewStorageKey = "spellstack_deck_view"

function getStoredDeckViewMode(): DeckViewMode {
    if (typeof window === "undefined") return "list"

    const stored = window.localStorage.getItem(deckViewStorageKey)
    return stored === "grid" || stored === "list" ? stored : "list"
}

export default function DeckPage() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { user, loading: authLoading } = useAuth()
    const { palette } = useTheme()
    const { t } = useI18n()
    const [decks, setDecks] = useState<Deck[]>([])
    const [, setLoading] = useState(true)
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState("all")
    const [selectedLength, setSelectedLength] = useState<DeckLengthFilter>("any")
    const [selectedSort, setSelectedSort] = useState<DeckSortOption>("newest")
    const [viewMode, setViewMode] = useState<DeckViewMode>(getStoredDeckViewMode)
    const usesFixedGridLayout = useMediaQuery("(max-width: 1399px)")
    const effectiveViewMode: DeckViewMode = usesFixedGridLayout ? "grid" : viewMode
    const trialModeActive = searchParams.get("mode") === "trial"
    const [trialStartError, setTrialStartError] = useState("")

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

    useEffect(() => {
        window.localStorage.setItem(deckViewStorageKey, viewMode)
    }, [viewMode])

    const handleDelete = async (id: number) => {
        await deleteDeck(id)
        setDecks(currentDecks => currentDecks.filter(deck => deck.id !== id))
    }

    const handlePlay = (deck: Deck) => {
        if (trialModeActive) {
            if (deck.words.length === 0) {
                setTrialStartError(t.trials.zeroWords)
                return
            }
            navigate(`/decks/${deck.id}/trial`)
            return
        }

        setSelectedDeck(deck)
    }

    const toggleTrialMode = () => {
        const nextParams = new URLSearchParams(searchParams)
        if (trialModeActive) nextParams.delete("mode")
        else nextParams.set("mode", "trial")
        setTrialStartError("")
        setSelectedDeck(null)
        setSearchParams(nextParams)
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

            <AppPageShell contentClassName="mt-4 flex min-h-[calc(100dvh-7rem)] flex-col sm:mt-14 sm:min-h-[calc(100dvh-8rem)]">
                    <LibraryPageToolbar
                        actions={
                            <>
                            <button
                                onClick={() => navigate("/decks/create")}
                                className={`group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full px-0 text-xs font-bold shadow-lg transition-[width,box-shadow] duration-300 ease-out sm:hover:w-24 ${palette.primaryButton} ${palette.primaryButtonText}`}
                                aria-label={t.common.createDeck}
                            >
                                <Plus size={24} strokeWidth={3} className={`shrink-0 ${palette.primaryButtonText}`} />
                                <span className="ml-0 max-w-0 whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:ml-2 group-hover:max-w-16 group-hover:opacity-100">
                                    {t.common.create}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={toggleTrialMode}
                                aria-pressed={trialModeActive}
                                aria-label={trialModeActive ? t.trials.disableMode : t.trials.enableMode}
                                title={trialModeActive ? t.trials.disableMode : t.trials.enableMode}
                                className={`group relative flex h-12 items-center justify-center overflow-hidden rounded-full border px-0 text-xs font-bold shadow-lg transition-[width,background-color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                                    trialModeActive
                                        ? `w-12 border-transparent ${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}`
                                        : `w-12 ${palette.border} bg-transparent text-white hover:w-24 focus:w-24`
                                }`}
                            >
                                <GraduationCap size={22} strokeWidth={2.6} className="shrink-0" />
                                {!trialModeActive && (
                                    <span className="ml-0 max-w-0 whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-16 group-hover:opacity-100 group-focus:ml-2 group-focus:max-w-16 group-focus:opacity-100">
                                        {t.common.trials}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setIsFilterOpen(isOpen => !isOpen)}
                                className={`group relative flex h-12 items-center justify-center overflow-hidden rounded-full px-0 text-xs font-bold shadow-lg transition-[width,box-shadow] duration-300 ease-out ${palette.primaryButton} ${palette.primaryButtonText} ${isFilterOpen ? `${activeFilterCount > 0 ? "w-28" : "w-24"} ${palette.glow}` : `${activeFilterCount > 0 ? "hover:w-28" : "hover:w-24"} w-12`}`}
                                aria-expanded={isFilterOpen}
                                aria-label={t.deckPage.toggleFilters}
                            >
                                <SlidersHorizontal size={20} strokeWidth={2.6} className={`shrink-0 ${palette.primaryButtonText}`} />
                                <span className={`whitespace-nowrap transition-all duration-300 ease-out ${isFilterOpen ? `${activeFilterCount > 0 ? "max-w-24" : "max-w-16"} ml-2 opacity-100` : `ml-0 max-w-0 opacity-0 group-hover:ml-2 ${activeFilterCount > 0 ? "group-hover:max-w-24" : "group-hover:max-w-16"} group-hover:opacity-100`}`}>
                                    {activeFilterCount > 0 ? t.deckPage.filterCount.replace("{count}", String(activeFilterCount)) : t.common.filter}
                                </span>
                            </button>

                            <div className="hidden min-[1400px]:block">
                                <DeckViewToggle
                                    value={viewMode}
                                    onChange={setViewMode}
                                    palette={palette}
                                />
                            </div>
                            </>
                        }
                    />

                    {trialModeActive && (
                        <div className="mb-4 flex flex-wrap items-center gap-3" aria-live="polite">
                            <span className={`inline-flex items-center gap-2 rounded-full border ${palette.border} bg-black/25 px-3 py-1.5 text-xs font-black text-white`}>
                                <GraduationCap size={16} aria-hidden="true" />
                                {t.trials.modeActive}
                            </span>
                            {trialStartError && <span className="text-sm font-bold text-red-300">{trialStartError}</span>}
                        </div>
                    )}

                    <div
                        className={`relative z-[1000] transition-[max-height,opacity,transform] duration-300 ease-out ${isFilterOpen ? "max-h-[32rem] translate-y-0 overflow-visible opacity-100 sm:max-h-40" : "pointer-events-none max-h-0 -translate-y-3 overflow-hidden opacity-0"}`}
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

                    <div className="relative z-0">
                        {filteredDecks.length === 0 ? (
                        <FadeIn>
                            <GradientFrame
                                glow
                                contentClassName="p-6 text-center sm:p-10"
                            >
                                <p className="text-2xl font-black">{decks.length === 0 ? t.deckPage.noDecksYet : t.deckPage.noDecksMatchFilters}</p>
                                <p className="mt-2 text-white/70">{decks.length === 0 ? t.deckPage.createFirstDeck : t.deckPage.tryChangingFilters}</p>

                                <button
                                    onClick={() => navigate("/decks/create")}
                                    className={`mt-6 rounded-full px-7 py-3 font-bold ${palette.primaryButtonText} transition ${palette.primaryButton}`}
                                >
                                    {t.common.createDeck}
                                </button>
                            </GradientFrame>
                        </FadeIn>
                    ) : (
                        effectiveViewMode === "list" ? (
                            <DeckListView
                                decks={filteredDecks}
                                onPlay={handlePlay}
                                onEdit={deck => navigate(`/decks/${deck.id}/edit`)}
                                onDelete={deck => handleDelete(deck.id)}
                                palette={palette}
                            />
                        ) : (
                            <DeckGridView
                                decks={filteredDecks}
                                onPlay={handlePlay}
                                onEdit={deck => navigate(`/decks/${deck.id}/edit`)}
                                onDelete={deck => handleDelete(deck.id)}
                                palette={palette}
                            />
                        )
                    )}

                        <FadeIn className="mt-auto pb-6 pt-8 text-center text-base text-white/80 sm:pb-16 sm:pt-10 sm:text-lg">
                            {t.deckPage.deckCount}: {filteredDecks.length}
                        </FadeIn>
                    </div>
            </AppPageShell>
        </>
    )
}

