import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Check, Crown, Lock, Plus, Send, Trophy, UsersRound } from "lucide-react"

import { getDecks, type Deck } from "../api/decks"
import { useUISound } from "../audio/useUISound"
import readySoundUrl from "../assets/SFX/ready_sfx.mp3"
import type { ActiveGameModifier, GameDirection, RoundLimit } from "../api/gameSession"
import { useAuth } from "../auth/AuthContext"
import FadeIn from "../components/FadeIn"
import GameModeModal from "../components/GameModeModal"
import GradientFrame from "../components/GradientFrame"
import AppPageShell from "../components/layout/AppPageShell"
import JoinRoomModal from "../components/multiplayer/JoinRoomModal"
import LibraryPageToolbar from "../components/navigation/LibraryPageToolbar"
import PageContentTransition from "../components/PageContentTransition"
import ProfileImage from "../components/ProfileImage"
import { countries, languages } from "../data/languages"
import { useTheme } from "../theme/ThemeContext"

const minimumMultiplayerWords = 10

interface MockPlayer {
    id: string
    userId?: string
    name: string
    countryCode: string
    isRoomOwner?: boolean
    ready?: boolean
    profileImage?: string | null
    profilePath?: string
}

type ProfileNavigationState = {
    openedFrom: "multiplayer-players-panel"
    returnTo: string
    profileMode: "preview"
}

interface ReadyConfig {
    direction: GameDirection
    modifiers: ActiveGameModifier[]
    roundLimit: RoundLimit
}

type RoomState = "landing" | "lobby"

const roomCodeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function randomChunk(length: number) {
    return Array.from({ length }, () => roomCodeCharacters[Math.floor(Math.random() * roomCodeCharacters.length)]).join("")
}

function generateRoomCode() {
    return `${randomChunk(2)}@${randomChunk(3)}`
}

function getLanguage(code: string) {
    return languages.find(language => language.code === code)
}

function getCountryFlag(code: string) {
    return countries.find(country => country.code === code)?.flagUrl
}

export default function MultiplayerPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, loading: authLoading, profileImage } = useAuth()
    const { palette, theme } = useTheme()
    const localPlayerId = user ? `user-${user.id}` : "local-player"
    const readySoundRef = useRef<HTMLAudioElement | null>(null)
    const [decks, setDecks] = useState<Deck[]>([])
    const [roomState, setRoomState] = useState<RoomState>("landing")
    const [roomCode, setRoomCode] = useState("")
    const [roomOwnerId, setRoomOwnerId] = useState<string | null>(null)
    const [currentHostId, setCurrentHostId] = useState<string | null>(null)
    const [joinModalOpen, setJoinModalOpen] = useState(false)
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
    const [modalDeck, setModalDeck] = useState<Deck | null>(null)
    const [readyConfig, setReadyConfig] = useState<ReadyConfig | null>(null)

    useEffect(() => {
        const roomFromUrl = new URLSearchParams(location.search).get("room")
        if (!roomFromUrl) return

        setRoomCode(roomFromUrl)
        setRoomState("lobby")
        setRoomOwnerId(currentOwner => currentOwner ?? localPlayerId)
        setCurrentHostId(currentHost => currentHost ?? localPlayerId)
    }, [localPlayerId, location.search])

    useEffect(() => {
        const audio = new Audio(readySoundUrl)
        audio.preload = "auto"
        readySoundRef.current = audio

        return () => {
            audio.pause()
            readySoundRef.current = null
        }
    }, [])

    useEffect(() => {
        if (authLoading) return

        if (!user) {
            navigate("/login")
            return
        }

        getDecks().then(setDecks)
    }, [authLoading, navigate, user])

    const players = useMemo<MockPlayer[]>(() => [
        { id: localPlayerId, userId: user ? String(user.id) : undefined, name: user?.username ?? "Player 1", countryCode: "no", isRoomOwner: roomOwnerId === localPlayerId, ready: Boolean(readyConfig), profileImage, profilePath: "/profile" },
        { id: "player-2", name: "Player 2", countryCode: "es", ready: true },
        { id: "player-3", name: "Player 3", countryCode: "gb", ready: false }
    ], [localPlayerId, profileImage, readyConfig, roomOwnerId, user])

    const isLocalHost = currentHostId === localPlayerId

    const createRoom = () => {
        const nextRoomCode = generateRoomCode()
        setRoomCode(nextRoomCode)
        setRoomState("lobby")
        setRoomOwnerId(localPlayerId)
        setCurrentHostId(localPlayerId)
        setSelectedDeck(null)
        setReadyConfig(null)
        navigate(`/multiplayer?room=${encodeURIComponent(nextRoomCode)}`, { replace: true })
    }

    const joinRoom = (code: string) => {
        setRoomCode(code)
        setRoomState("lobby")
        setRoomOwnerId("player-2")
        setCurrentHostId("player-2")
        setJoinModalOpen(false)
        setSelectedDeck(null)
        setReadyConfig(null)
        navigate(`/multiplayer?room=${encodeURIComponent(code)}`, { replace: true })
    }

    const openDeckSetup = (deck: Deck) => {
        if (deck.words.length < minimumMultiplayerWords) return

        if (selectedDeck?.id !== deck.id) {
            setReadyConfig(null)
        }

        setSelectedDeck(deck)
        setModalDeck(deck)
    }

    const handleReady = (direction: GameDirection, modifiers: ActiveGameModifier[], roundLimit: RoundLimit) => {
        const readySound = readySoundRef.current
        if (readySound && theme.audio.audioEnabled && theme.audio.uiVolume > 0) {
            readySound.pause()
            readySound.currentTime = 0
            readySound.volume = Math.min(1, Math.max(0, theme.audio.uiVolume))
            readySound.play().catch(() => undefined)
        }

        setReadyConfig({ direction, modifiers, roundLimit })
        setModalDeck(null)
    }

    const shuffleHost = () => {
        const playerIds = players.map(player => player.id)
        if (playerIds.length <= 1) return

        // Mock-only: real multiplayer host rotation must be server-authoritative.
        setCurrentHostId(currentHost => {
            const currentIndex = playerIds.findIndex(playerId => playerId === currentHost)
            return playerIds[(currentIndex + 1) % playerIds.length]
        })
    }

    return (
        <>
            <JoinRoomModal
                isOpen={joinModalOpen}
                onClose={() => setJoinModalOpen(false)}
                onJoin={joinRoom}
                palette={palette}
            />

            {modalDeck && (
                <GameModeModal
                    isOpen={modalDeck !== null}
                    deck={modalDeck}
                    onSelect={handleReady}
                    onClose={() => setModalDeck(null)}
                    variant="multiplayer"
                    primaryLabel={readyConfig ? "Update ready" : "Ready"}
                    disabledModifiers={["zen"]}
                    gameModeLocked={!isLocalHost}
                    gameModeLockedMessage="Waiting for host to choose game mode"
                />
            )}

            <AppPageShell
                className="!min-h-[calc(100vh-4rem)] overflow-hidden"
                contentClassName="mt-14 flex h-[calc(100vh-8rem)] min-h-0 flex-col"
            >
                <LibraryPageToolbar reserveActionsSlot />

                <PageContentTransition className="flex min-h-0 flex-1 flex-col">
                    {roomState === "landing" ? (
                        <MultiplayerLanding onCreate={createRoom} onJoin={() => setJoinModalOpen(true)} palette={palette} />
                    ) : (
                        <MultiplayerLobby
                            roomCode={roomCode}
                            decks={decks}
                            selectedDeck={selectedDeck}
                            readyConfig={readyConfig}
                            roomOwnerId={roomOwnerId}
                            currentHostId={currentHostId}
                            isLocalHost={isLocalHost}
                            players={players}
                            onShuffleHost={shuffleHost}
                            onDeckSelect={openDeckSetup}
                            palette={palette}
                        />
                    )}
                </PageContentTransition>
            </AppPageShell>
        </>
    )
}

function MultiplayerLanding({ onCreate, onJoin, palette }: {
    onCreate: () => void
    onJoin: () => void
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    return (
        <FadeIn className="flex flex-1 items-center justify-center">
            <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
                <LandingAction
                    title="Create a room"
                    description="Open a mock lobby and invite friends with a room code."
                    icon={<Plus size={30} strokeWidth={3} />}
                    onClick={onCreate}
                    palette={palette}
                />
                <LandingAction
                    title="Join a room"
                    description="Enter a room code from a friend to join their mock lobby."
                    icon={<Send size={28} strokeWidth={2.8} />}
                    onClick={onJoin}
                    palette={palette}
                />
            </div>
        </FadeIn>
    )
}

function LandingAction({ title, description, icon, onClick, palette }: {
    title: string
    description: string
    icon: ReactNode
    onClick: () => void
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const { playHoverSound } = useUISound()

    return (
        <GradientFrame glow glass radius={26} radiusClass="rounded-[1.625rem]" className="h-full transition hover:-translate-y-1">
            <button
                type="button"
                onClick={onClick}
                onMouseEnter={playHoverSound}
                className="flex h-full min-h-48 w-full flex-col items-start justify-between rounded-[inherit] p-6 text-left"
            >
                <span className={`grid h-14 w-14 place-items-center rounded-2xl ${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}`}>
                    {icon}
                </span>
                <span>
                    <span className="block text-3xl font-black text-white">{title}</span>
                    <span className="mt-3 block max-w-sm text-sm font-semibold leading-6 text-white/55">{description}</span>
                </span>
            </button>
        </GradientFrame>
    )
}

function MultiplayerLobby({ roomCode, decks, selectedDeck, readyConfig, currentHostId, isLocalHost, players, onShuffleHost, onDeckSelect, palette }: {
    roomCode: string
    decks: Deck[]
    selectedDeck: Deck | null
    readyConfig: ReadyConfig | null
    roomOwnerId: string | null
    currentHostId: string | null
    isLocalHost: boolean
    players: MockPlayer[]
    onShuffleHost: () => void
    onDeckSelect: (deck: Deck) => void
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const currentHost = players.find(player => player.id === currentHostId)

    return (
        <FadeIn className="flex min-h-0 flex-1 flex-col gap-8">
            <header className="w-fit max-w-full rounded-[1.75rem] border border-white/10 bg-black/35 px-6 py-5 shadow-2xl shadow-black/35 backdrop-blur-md sm:px-7">
                <p className={`text-sm font-black uppercase tracking-[0.28em] ${palette.accentText}`}>Multiplayer room</p>
                <h1 className="mt-3 text-5xl font-black text-white">Room code: {roomCode}</h1>
                <p className="mt-3 text-base font-semibold text-white/62">
                    Send this code to your friends to let them join your room
                </p>
            </header>

            <div className="grid min-h-0 flex-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <section className="min-w-0">
                    <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-white">Choose deck</h2>
                            <p className="mt-1 text-sm font-semibold text-white/50">
                                Multiplayer decks need at least {minimumMultiplayerWords} words.
                            </p>
                            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-white/42">
                                {isLocalHost
                                    ? "You are host: choose the shared game mode"
                                    : `${currentHost?.name ?? "Host"} chooses game mode`}
                            </p>
                        </div>

                        {readyConfig && selectedDeck && (
                            <div className={`rounded-full border ${palette.border} ${palette.card} px-4 py-2 text-sm font-black text-white shadow-xl`}>
                                Ready with {selectedDeck.name}
                            </div>
                        )}
                    </div>

                    <div className="grid justify-start gap-5 [grid-template-columns:repeat(auto-fill,minmax(18rem,22rem))]">
                        {decks.map(deck => (
                            <MultiplayerDeckCard
                                key={deck.id}
                                deck={deck}
                                selected={selectedDeck?.id === deck.id}
                                ready={selectedDeck?.id === deck.id && Boolean(readyConfig)}
                                disabled={deck.words.length < minimumMultiplayerWords}
                                onSelect={() => onDeckSelect(deck)}
                                palette={palette}
                            />
                        ))}
                    </div>
                </section>

                <aside className="w-full xl:ml-[clamp(4rem,calc((100vw-72rem)/2-3rem),36rem)] xl:w-80 xl:self-center xl:justify-self-start">
                    <PlayersPanel players={players} currentHostId={currentHostId} onShuffleHost={onShuffleHost} palette={palette} />
                </aside>
            </div>
        </FadeIn>
    )
}

function MultiplayerDeckCard({ deck, selected, ready, disabled, onSelect, palette }: {
    deck: Deck
    selected: boolean
    ready: boolean
    disabled: boolean
    onSelect: () => void
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const sourceLanguage = getLanguage(deck.language)
    const translationLanguage = getLanguage(deck.translationLanguage)
    const sourceIsLearning = deck.language === deck.learningLanguage
    const translationIsLearning = deck.translationLanguage === deck.learningLanguage
    const { playHoverSound } = useUISound()

    return (
        <button
            type="button"
            onClick={onSelect}
            onMouseEnter={playHoverSound}
            disabled={disabled}
            className={`group relative h-full rounded-3xl text-left transition duration-200 ${disabled ? "cursor-not-allowed opacity-55" : "hover:-translate-y-1"}`}
        >
            <GradientFrame
                glow={selected}
                glass
                radius={24}
                radiusClass="rounded-3xl"
                className="h-full rounded-3xl"
                contentClassName="h-full rounded-[inherit] px-4 py-3"
            >
                <div className="flex h-full min-h-[9rem] flex-col">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-4">
                            <LobbyFlag flagUrl={sourceLanguage?.flagUrl} label={sourceLanguage?.label ?? deck.language} learning={sourceIsLearning} />
                            <LobbyFlag flagUrl={translationLanguage?.flagUrl} label={translationLanguage?.label ?? deck.translationLanguage} learning={translationIsLearning} />
                        </div>

                        {ready ? (
                            <span className={`grid h-8 w-8 place-items-center rounded-full ${palette.primaryButton} ${palette.primaryButtonText}`}>
                                <Check size={18} strokeWidth={3} />
                            </span>
                        ) : disabled ? (
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70">
                                <Lock size={17} strokeWidth={2.6} />
                            </span>
                        ) : null}
                    </div>

                    <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 pt-4">
                        <div className="min-w-0">
                            <h3 className="truncate text-2xl font-black text-white">{deck.name}</h3>
                            <div className="mt-2 flex items-center gap-2 text-sm font-bold text-white/72">
                                <Trophy size={19} strokeWidth={2.8} className={palette.accentText} />
                                {deck.highScore.toLocaleString("nb-NO")}
                            </div>
                        </div>
                        <div className="text-right leading-none">
                            <p className="text-5xl font-black text-white">{deck.words.length}</p>
                            <p className="mt-1 text-sm font-semibold text-white/65">Words</p>
                        </div>
                    </div>

                    {disabled && (
                        <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-white/55">
                            Needs {minimumMultiplayerWords} words
                        </p>
                    )}
                </div>
            </GradientFrame>
        </button>
    )
}

function LobbyFlag({ flagUrl, label, learning }: { flagUrl?: string; label: string; learning: boolean }) {
    return (
        <div>
            {flagUrl ? (
                <img src={flagUrl} alt={`${label} flag`} className="h-10 w-16 rounded-xl object-cover shadow-lg" />
            ) : (
                <div className="h-10 w-16 rounded-xl bg-white/10" />
            )}
            <p className={`mt-1 text-center text-[11px] font-bold ${learning ? "text-white" : "text-transparent"}`}>
                Learning
            </p>
        </div>
    )
}

function PlayersPanel({ players, currentHostId, onShuffleHost, palette }: {
    players: MockPlayer[]
    currentHostId: string | null
    onShuffleHost: () => void
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    return (
        <div className={`h-fit w-full rounded-[2rem] border ${palette.border} ${palette.card} p-5 shadow-2xl backdrop-blur-xl`}>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className={`text-xs font-black uppercase tracking-[0.22em] ${palette.accentText}`}>Players</p>
                    <h2 className="mt-1 text-2xl font-black text-white">Players {players.length}/4</h2>
                </div>
                <UsersRound size={26} strokeWidth={2.5} className="text-white/50" />
            </div>

            <div className="mt-6 space-y-4">
                {players.map(player => (
                    <PlayerRow key={player.id} player={player} isCurrentHost={player.id === currentHostId} palette={palette} />
                ))}
            </div>

            <button
                type="button"
                onClick={onShuffleHost}
                className="mt-5 w-full rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/55 transition hover:bg-white/[0.09] hover:text-white"
            >
                Mock: shuffle host
            </button>
        </div>
    )
}

function PlayerRow({ player, isCurrentHost, palette }: {
    player: MockPlayer
    isCurrentHost: boolean
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const navigate = useNavigate()
    const location = useLocation()
    const { playHoverSound } = useUISound()
    const flagUrl = getCountryFlag(player.countryCode)
    const canOpenProfile = Boolean(player.profilePath)
    const rowClassName = `flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
        player.ready
            ? "border-emerald-300/30 bg-emerald-500/15 shadow-[0_0_22px_rgba(52,211,153,0.12)]"
            : "border-white/10 bg-black/15"
    } ${canOpenProfile ? "cursor-pointer hover:border-white/24 hover:bg-white/[0.08]" : ""}`
    const rowContent = (
        <>
            <div className="relative grid h-12 w-12 place-items-center overflow-visible rounded-full bg-white/12 text-lg font-black text-white">
                {player.name.slice(0, 1)}
                <ProfileImage
                    src={player.profileImage}
                    alt={`${player.name} profile`}
                    className="absolute inset-0 h-full w-full rounded-full object-cover"
                />
                {isCurrentHost && (
                    <Crown
                        size={20}
                        strokeWidth={2.8}
                        className={`absolute -left-2 -top-2 rotate-[-18deg] ${palette.accentText}`}
                        fill="currentColor"
                    />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-white">{player.name}</p>
                <p className={`mt-0.5 text-xs font-bold ${player.ready ? "text-emerald-300" : "text-white/38"}`}>
                    {player.ready ? "Ready" : "Not ready"}
                </p>
            </div>

            {flagUrl && <img src={flagUrl} alt="" className="h-5 w-8 rounded-sm object-cover shadow-lg" />}
        </>
    )

    return (
        canOpenProfile ? (
            <button
                type="button"
                className={rowClassName}
                onClick={() => {
                    if (!player.profilePath) return

                    const state: ProfileNavigationState = {
                        openedFrom: "multiplayer-players-panel",
                        returnTo: `${location.pathname}${location.search}`,
                        profileMode: "preview"
                    }

                    navigate(player.profilePath, { state })
                }}
                onMouseEnter={playHoverSound}
                aria-label={`Open ${player.name} profile`}
            >
                {rowContent}
            </button>
        ) : (
            <div className={rowClassName}>
                {rowContent}
            </div>
        )
    )
}
