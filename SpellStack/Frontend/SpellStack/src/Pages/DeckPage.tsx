import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LogIn, LogOut, Palette, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react"

import { getDecks, deleteDeck, type Deck } from "../api/decks"
import type { ActiveGameModifier, GameDirection } from "../api/gameSession"
import { languages } from "../data/languages"
import FadeIn from "../components/FadeIn"
import GameModeModal from "../components/GameModeModal"
import { useAuth } from "../auth/AuthContext"
import ThemedPage from "../components/ThemedPage"
import { useTheme } from "../theme/ThemeContext"
import PageContentTransition from "../components/PageContentTransition"

function getLanguageFlag(code: string) {
    return languages.find(language => language.code === code)?.flagUrl
}

export default function DeckPage() {
    const navigate = useNavigate()
    const { user, loading: authLoading, logoutUser, profileImage } = useAuth()
    const { palette } = useTheme()
    const [decks, setDecks] = useState<Deck[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
    const [profileMenuOpen, setProfileMenuOpen] = useState(false)

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
        setDecks(decks.filter(deck => deck.id !== id))
    }

    const handlePlay = (deck: Deck) => {
        setSelectedDeck(deck)
    }

    const handleModeSelect = (direction: GameDirection, modifiers: ActiveGameModifier[]) => {
        const params = new URLSearchParams({ direction })
        if (modifiers.length > 0) params.set("mods", modifiers.join(","))
        navigate(`/decks/${selectedDeck!.id}/play?${params.toString()}`)
    }

    const handleLogout = async () => {
        await logoutUser()
        setProfileMenuOpen(false)
        navigate("/login")
    }

    if (authLoading || loading) {
        return (
            <ThemedPage className="px-6 py-8 text-white">
                <div className="relative z-10 mt-20 text-center text-gray-400">
                    Loading...
                </div>
            </ThemedPage>
        )
    }

    return (
            <PageContentTransition>
            <GameModeModal
                isOpen={selectedDeck !== null}
                deck={selectedDeck!}
                onSelect={handleModeSelect}
            />

            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[102rem] flex-col">
                <div className="flex justify-end">
                    <div className="relative">
                        <button
                            onClick={() => setProfileMenuOpen(open => !open)}
                            className={`grid h-14 w-14 place-items-center overflow-hidden rounded-full border-2 ${palette.border} ${profileImage ? "bg-slate-900" : palette.primaryButton} text-xl font-black ${palette.glow} transition hover:scale-105`}
                            aria-label="Open profile menu"
                        >
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={user ? `${user.username} profile` : "Profile"}
                                    className="h-full w-full object-cover"
                                />
                            ) : user ? (
                                user.username.slice(0, 1).toUpperCase()
                            ) : (
                                <UserRound size={24} strokeWidth={2.5} />
                            )}
                        </button>

                        {profileMenuOpen && (
                            <div className={`absolute right-0 top-16 z-20 w-44 overflow-hidden rounded-lg border ${palette.border} bg-slate-950/95 py-2 shadow-2xl backdrop-blur`}>
                                <button
                                    onClick={() => navigate(user ? "/profile" : "/login")}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-fuchsia-500/20 hover:text-white"
                                >
                                    <UserRound size={17} strokeWidth={2.25} />
                                    Profile
                                </button>
                                <button
                                    onClick={() => navigate("/theme")}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-fuchsia-500/20 hover:text-white"
                                >
                                    <Palette size={17} strokeWidth={2.25} />
                                    Theme
                                </button>
                                {user ? (
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-fuchsia-500/20 hover:text-white"
                                    >
                                        <LogOut size={17} strokeWidth={2.25} />
                                        Log out
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate("/login")}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-fuchsia-500/20 hover:text-white"
                                    >
                                        <LogIn size={17} strokeWidth={2.25} />
                                        Log in
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <main className="mx-auto mt-14 flex w-full max-w-3xl flex-1 flex-col">
                    <FadeIn className="mb-8 grid grid-cols-[1fr_auto_auto] items-center gap-6">
                        <h1 className={`text-2xl font-black ${palette.accentText}`}>Your profiles</h1>
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
                    </FadeIn>

                    {decks.length === 0 ? (
                        <FadeIn className={`rounded-lg border-2 ${palette.border} ${palette.card} p-10 text-center ${palette.glow}`}>
                            <p className="text-2xl font-black">No decks yet</p>
                            <p className="mt-2 text-white/70">Create your first deck to get started</p>
                            <button
                                onClick={() => navigate("/decks/create")}
                                className={`mt-6 rounded-full px-7 py-3 font-bold text-white transition ${palette.primaryButton}`}
                            >
                                Create deck
                            </button>
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
                        Profile count: {decks.length}
                    </FadeIn>
                </main>
            </div>
            </PageContentTransition>
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
        <div className="mx-auto w-full max-w-xl overflow-visible">
            <div className={`group relative grid min-h-24 w-full max-w-[calc(100vw-3rem)] grid-cols-[minmax(0,1fr)_auto_auto_0rem] items-center gap-4 overflow-hidden rounded-[28px] border-2 ${palette.border} ${palette.card} px-8 py-5 ${palette.glow} transition-all duration-300 hover:w-[42rem] hover:grid-cols-[minmax(0,1fr)_auto_auto_10rem] hover:bg-slate-700/80`}>
                <div className="min-w-0">
                    <h2 className="truncate text-3xl font-black">{deck.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-white/80">Word count: {deck.words.length}</p>
                    <p className="text-xs text-white/50">Highscore: {deck.highScore}</p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                    <img src={getLanguageFlag(deck.language)} className="h-11 w-16 rounded-lg object-cover" />
                    <img src={getLanguageFlag(deck.translationLanguage)} className="h-11 w-16 rounded-lg object-cover" />
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
            </div>
        </div>
    )
}
