import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Check, Crown, Lock, Plus, Send, Trophy } from "lucide-react"

import { getDecks, type Deck } from "../api/decks"
import { useUISound } from "../audio/useUISound"
import readySoundUrl from "../assets/SFX/ready_sfx.mp3"
import type { ActiveGameModifier, GameDirection } from "../api/gameSession"
import { useAuth } from "../auth/AuthContext"
import FadeIn from "../components/FadeIn"
import GameModeModal from "../components/GameModeModal"
import GradientFrame from "../components/GradientFrame"
import AppPageShell from "../components/layout/AppPageShell"
import JoinRoomModal from "../components/multiplayer/JoinRoomModal"
import MultiplayerRaceLeaderboard from "../components/multiplayer/MultiplayerRaceLeaderboard"
import RoomGameModeModal from "../components/multiplayer/RoomGameModeModal"
import LibraryPageToolbar from "../components/navigation/LibraryPageToolbar"
import PageContentTransition from "../components/PageContentTransition"
import ProfileImage from "../components/ProfileImage"
import { countries, getCountryName } from "../data/countries"
import { languages } from "../data/languages"
import { useI18n } from "../i18n/I18nContext"
import type {
    MultiplayerGameModeId,
    MultiplayerPlayer,
    MultiplayerRaceScoreCap,
    MultiplayerRoom,
    MultiplayerRoomSettings
} from "../multiplayer/multiplayerTypes"
import { type MultiplayerConnectionStatus } from "../multiplayer/multiplayerConnection"
import { useMultiplayerRoom } from "../multiplayer/useMultiplayerRoom"
import { useTheme } from "../theme/ThemeContext"
import { resolveAssetUrl } from "../utils/assetUrl"
import PlayPage from "./PlayPage"

const minimumMultiplayerWords = 10

type LobbyPlayer = MultiplayerPlayer & {
    id: string
    name: string
    ready?: boolean
    countryCode?: string | null
    profileImage?: string | null
    profilePath?: string
}

type ProfileNavigationState = {
    openedFrom: "multiplayer-players-panel"
    returnTo: string
    profileMode: "preview"
}

function getLanguage(code: string) {
    return languages.find(language => language.code === code)
}

function getCountryFlag(code?: string | null) {
    if (!code) return undefined
    return countries.find(country => country.code === code.toUpperCase())?.flagUrl
}

function getMultiplayerStatusMessage(status: MultiplayerConnectionStatus) {
    if (status === "connecting") return "Connecting..."
    if (status === "reconnecting") return "Reconnecting..."
    return null
}

export default function MultiplayerPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, loading: authLoading } = useAuth()
    const { palette, theme } = useTheme()
    const readySoundRef = useRef<HTMLAudioElement | null>(null)
    const changeSettingsButtonRef = useRef<HTMLButtonElement | null>(null)
    const attemptedJoinRoomRef = useRef<string | null>(null)
    const handledInvalidationIdRef = useRef(0)
    const [decks, setDecks] = useState<Deck[]>([])
    const [joinModalOpen, setJoinModalOpen] = useState(false)
    const [roomSettingsModalOpen, setRoomSettingsModalOpen] = useState(false)
    const [modalDeck, setModalDeck] = useState<Deck | null>(null)
    const {
        room,
        status: multiplayerStatus,
        error: multiplayerError,
        isBusy: multiplayerBusy,
        isUpdatingSettings,
        settingsError,
        isRunningRoomAction,
        roomActionError,
        roomSessionInvalidationId,
        createRoom: createMultiplayerRoom,
        joinRoom: joinMultiplayerRoom,
        leaveRoom: leaveMultiplayerRoom,
        updateRoomSettings,
        setReady,
        setUnready,
        startRace,
        clearError,
        clearSettingsError,
        clearRoomActionError
    } = useMultiplayerRoom()
    const currentHostId = room?.ownerUserId ?? null
    const isLocalHost = Boolean(user && currentHostId === String(user.id))
    const localPlayer = room?.players.find(player => user && player.userId === String(user.id)) ?? null
    const selectedDeck = decks.find(deck => deck.id === localPlayer?.selectedDeckId) ?? null

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

    useEffect(() => {
        if (authLoading || !user) return

        const roomFromUrl = new URLSearchParams(location.search).get("room")?.trim().toUpperCase()
        if (!roomFromUrl || room?.code === roomFromUrl || attemptedJoinRoomRef.current === roomFromUrl) return

        attemptedJoinRoomRef.current = roomFromUrl
        joinMultiplayerRoom(roomFromUrl).catch(() => {
            if (room) return

            attemptedJoinRoomRef.current = null
            navigate("/multiplayer", { replace: true })
        })
    }, [authLoading, joinMultiplayerRoom, location.search, navigate, room, room?.code, user])

    useEffect(() => {
        if (roomSessionInvalidationId === 0 || handledInvalidationIdRef.current === roomSessionInvalidationId) return

        handledInvalidationIdRef.current = roomSessionInvalidationId
        attemptedJoinRoomRef.current = null

        if (new URLSearchParams(location.search).get("room")) {
            navigate("/multiplayer", { replace: true })
        }
    }, [location.search, navigate, roomSessionInvalidationId])

    useEffect(() => {
        if (!room) return

        const roomPath = room.phase === "lobby" ? "/multiplayer" : "/multiplayer/race"
        const roomUrl = `${roomPath}?room=${encodeURIComponent(room.code)}`
        if (`${location.pathname}${location.search}` !== roomUrl) {
            navigate(roomUrl, { replace: true })
        }
    }, [location.pathname, location.search, navigate, room])

    const players: LobbyPlayer[] = (room?.players ?? []).map(player => {
        const isCurrentUser = Boolean(user && player.userId === String(user.id))

        return {
            ...player,
            id: player.userId,
            name: player.username,
            ready: player.isReady,
            profileImage: resolveAssetUrl(player.profileImageUrl),
            profilePath: isCurrentUser ? "/profile" : `/profile/${player.userId}`
        }
    })

    const createRoom = async () => {
        try {
            const createdRoom = await createMultiplayerRoom()
            setRoomSettingsModalOpen(false)
            navigate(`/multiplayer?room=${encodeURIComponent(createdRoom.code)}`, { replace: true })
        }
        catch {
            // Error state is surfaced by useMultiplayerRoom.
        }
    }

    const joinRoom = async (code: string) => {
        try {
            const joinedRoom = await joinMultiplayerRoom(code)
            setJoinModalOpen(false)
            setRoomSettingsModalOpen(false)
            navigate(`/multiplayer?room=${encodeURIComponent(joinedRoom.code)}`, { replace: true })
        }
        catch {
            // Error state is surfaced by useMultiplayerRoom.
        }
    }

    const handleLeaveRoom = async () => {
        await leaveMultiplayerRoom()
        setRoomSettingsModalOpen(false)
        setModalDeck(null)
        attemptedJoinRoomRef.current = null
        navigate("/multiplayer", { replace: true })
    }

    const openDeckSetup = (deck: Deck) => {
        if (deck.words.length < minimumMultiplayerWords) return

        if (localPlayer?.isReady && localPlayer.selectedDeckId !== deck.id) {
            void setUnready()
        }

        setModalDeck(deck)
    }

    const handleReady = async (direction: GameDirection, modifiers: ActiveGameModifier[]) => {
        if (!modalDeck || !room) return

        try {
            await setReady(modalDeck.id, direction, modifiers, room.settings.settingsVersion)
            const readySound = readySoundRef.current
            if (readySound && theme.audio.audioEnabled && theme.audio.uiVolume > 0) {
                readySound.pause()
                readySound.currentTime = 0
                readySound.volume = Math.min(1, Math.max(0, theme.audio.uiVolume))
                readySound.play().catch(() => undefined)
            }

            setModalDeck(null)
        } catch {
            // The shared room action error is rendered in the lobby.
        }
    }

    const closeRoomSettingsModal = () => {
        setRoomSettingsModalOpen(false)
        window.requestAnimationFrame(() => changeSettingsButtonRef.current?.focus())
    }

    const handleRoomSettingsConfirm = async (
        gameModeId: MultiplayerGameModeId,
        scoreCap: MultiplayerRaceScoreCap
    ) => {
        await updateRoomSettings(gameModeId, scoreCap)
        closeRoomSettingsModal()
    }

    if (
        room &&
        room.phase !== "lobby" &&
        room.race &&
        localPlayer?.selectedDeckId &&
        localPlayer.direction
    ) {
        const winner = room.players.find(player => player.userId === room.race?.winnerUserId)

        return (
            <PlayPage
                multiplayerRace={{
                    deckId: localPlayer.selectedDeckId,
                    direction: localPlayer.direction,
                    modifiers: localPlayer.modifiers,
                    raceId: room.race.raceId,
                    startsAtUtc: room.race.startsAtUtc,
                    answerSequenceStart: localPlayer.lastAnswerSequence,
                    isFinished: room.phase === "finished",
                    winnerName: winner?.username ?? null,
                    overlay: (
                        <MultiplayerRaceLeaderboard
                            players={room.players}
                            localUserId={localPlayer.userId}
                        />
                    )
                }}
            />
        )
    }

    return (
        <>
            <JoinRoomModal
                isOpen={joinModalOpen}
                onClose={() => {
                    clearError()
                    setJoinModalOpen(false)
                }}
                onJoin={joinRoom}
                isLoading={multiplayerBusy}
                error={multiplayerError}
                palette={palette}
            />

            {room && (
                <RoomGameModeModal
                    key={`${room.settings.settingsVersion}-${roomSettingsModalOpen}`}
                    isOpen={roomSettingsModalOpen && isLocalHost}
                    settings={room.settings}
                    isLoading={isUpdatingSettings}
                    error={settingsError}
                    palette={palette}
                    onClose={closeRoomSettingsModal}
                    onConfirm={handleRoomSettingsConfirm}
                />
            )}

            {modalDeck && (
                <GameModeModal
                    isOpen={modalDeck !== null}
                    deck={modalDeck}
                    onSelect={handleReady}
                    onClose={() => setModalDeck(null)}
                    variant="multiplayer"
                    primaryLabel={localPlayer?.isReady ? "Update ready" : "Ready"}
                    disabledModifiers={["zen"]}
                    gameModeLocked={!isLocalHost}
                    gameModeLockedMessage="Waiting for host to choose game mode"
                />
            )}

            <AppPageShell
                className="!min-h-[calc(100dvh-2rem)] overflow-x-hidden min-[1400px]:!min-h-[calc(100dvh-4rem)] min-[1400px]:overflow-hidden"
                contentClassName="mt-4 flex min-h-[calc(100dvh-7rem)] flex-col sm:mt-14 min-[1400px]:h-[calc(100dvh-8rem)] min-[1400px]:min-h-0"
            >
                <LibraryPageToolbar reserveActionsSlot />

                <PageContentTransition className="flex min-h-0 flex-1 flex-col">
                    {!room ? (
                        <MultiplayerLanding
                            onCreate={createRoom}
                            onJoin={() => {
                                clearError()
                                setJoinModalOpen(true)
                            }}
                            isBusy={multiplayerBusy}
                            status={multiplayerStatus}
                            error={multiplayerError}
                            palette={palette}
                        />
                    ) : (
                        <MultiplayerLobby
                            roomCode={room.code}
                            maxPlayers={room.maxPlayers}
                            decks={decks}
                            selectedDeck={selectedDeck}
                            localPlayer={localPlayer}
                            currentHostId={currentHostId}
                            isLocalHost={isLocalHost}
                            players={players}
                            settings={room.settings}
                            onLeaveRoom={handleLeaveRoom}
                            onChangeSettings={() => {
                                clearSettingsError()
                                setRoomSettingsModalOpen(true)
                            }}
                            changeSettingsButtonRef={changeSettingsButtonRef}
                            onDeckSelect={openDeckSetup}
                            connectionStatus={multiplayerStatus}
                            connectionError={multiplayerError}
                            networkBusy={multiplayerBusy}
                            roomActionBusy={isRunningRoomAction}
                            roomActionError={roomActionError}
                            onStartRace={() => {
                                clearRoomActionError()
                                return startRace()
                            }}
                            palette={palette}
                        />
                    )}
                </PageContentTransition>
            </AppPageShell>

            {room?.phase === "lobby" && (
                <aside className="fixed right-9 top-[calc(50%+0.75rem)] z-30 hidden w-80 -translate-y-1/2 min-[1400px]:block 2xl:w-[21rem]">
                    <PlayersPanel
                        players={players}
                        currentHostId={currentHostId}
                        maxPlayers={room.maxPlayers}
                        isLocalHost={isLocalHost}
                        settingsVersion={room.settings.settingsVersion}
                        isStartingRace={isRunningRoomAction}
                        actionError={roomActionError}
                        onStartRace={() => {
                            clearRoomActionError()
                            return startRace()
                        }}
                        palette={palette}
                    />
                </aside>
            )}
        </>
    )
}

function MultiplayerLanding({ onCreate, onJoin, isBusy, status, error, palette }: {
    onCreate: () => void | Promise<void>
    onJoin: () => void
    isBusy: boolean
    status: MultiplayerConnectionStatus
    error: string | null
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const statusMessage = error ? null : getMultiplayerStatusMessage(status)

    return (
        <FadeIn className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-3xl">
                <div className="grid gap-5 sm:grid-cols-2">
                    <LandingAction
                        title="Create a room"
                        description="Open a lobby and invite friends with a room code."
                        icon={<Plus size={30} strokeWidth={3} />}
                        onClick={onCreate}
                        disabled={isBusy}
                        palette={palette}
                    />
                    <LandingAction
                        title="Join a room"
                        description="Enter a room code from a friend to join their lobby."
                        icon={<Send size={28} strokeWidth={2.8} />}
                        onClick={onJoin}
                        disabled={isBusy}
                        palette={palette}
                    />
                </div>

                {(error || statusMessage) && (
                    <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${error ? "border-red-300/25 bg-red-500/12 text-red-100" : "border-white/10 bg-white/[0.06] text-white/70"}`}>
                        {error ?? statusMessage}
                    </p>
                )}
            </div>
        </FadeIn>
    )
}

function LandingAction({ title, description, icon, onClick, disabled, palette }: {
    title: string
    description: string
    icon: ReactNode
    onClick: () => void | Promise<void>
    disabled: boolean
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const { playHoverSound } = useUISound()

    return (
        <GradientFrame glow glass radius={26} radiusClass="rounded-[1.625rem]" className="h-full transition hover:-translate-y-1">
            <button
                type="button"
                onClick={onClick}
                onMouseEnter={playHoverSound}
                disabled={disabled}
                className="flex h-full min-h-48 w-full flex-col items-start justify-between rounded-[inherit] p-6 text-left disabled:cursor-not-allowed disabled:opacity-55"
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

function MultiplayerLobby({ roomCode, maxPlayers, decks, selectedDeck, localPlayer, currentHostId, isLocalHost, players, settings, onLeaveRoom, onChangeSettings, changeSettingsButtonRef, onDeckSelect, connectionStatus, connectionError, networkBusy, roomActionBusy, roomActionError, onStartRace, palette }: {
    roomCode: string
    maxPlayers: number
    decks: Deck[]
    selectedDeck: Deck | null
    localPlayer: MultiplayerPlayer | null
    currentHostId: string | null
    isLocalHost: boolean
    players: LobbyPlayer[]
    settings: MultiplayerRoomSettings
    onLeaveRoom: () => void | Promise<void>
    onChangeSettings: () => void
    changeSettingsButtonRef: RefObject<HTMLButtonElement | null>
    onDeckSelect: (deck: Deck) => void
    connectionStatus: MultiplayerConnectionStatus
    connectionError: string | null
    networkBusy: boolean
    roomActionBusy: boolean
    roomActionError: string | null
    onStartRace: () => Promise<MultiplayerRoom | null>
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const currentHost = players.find(player => player.id === currentHostId)
    const statusMessage = connectionError ?? getMultiplayerStatusMessage(connectionStatus)

    return (
        <FadeIn className="relative flex min-h-0 flex-1 flex-col gap-6 sm:gap-8">
            <header className="w-full max-w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 shadow-2xl shadow-black/35 backdrop-blur-md sm:w-fit sm:rounded-[1.75rem] sm:px-7 sm:py-5">
                <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                        <p className={`text-sm font-black uppercase tracking-[0.28em] ${palette.accentText}`}>Multiplayer room</p>
                        <h1 className="mt-2 break-all text-3xl font-black text-white sm:mt-3 sm:text-5xl">Room code: {roomCode}</h1>
                        <p className="mt-3 text-base font-semibold text-white/62">
                            Send this code to your friends to let them join your room
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onLeaveRoom}
                        disabled={networkBusy}
                        className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/60 transition hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        Leave room
                    </button>
                </div>
                {statusMessage && (
                    <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${connectionError ? "border-red-300/25 bg-red-500/12 text-red-100" : "border-white/10 bg-white/[0.06] text-white/70"}`}>
                        {statusMessage}
                    </p>
                )}

                <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-4">
                    <dl className="flex flex-wrap gap-x-8 gap-y-3">
                        <div>
                            <dt className="text-xs font-black uppercase tracking-[0.14em] text-white/42">Game mode</dt>
                            <dd className="mt-1 text-base font-black text-white">Race</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-black uppercase tracking-[0.14em] text-white/42">Score cap</dt>
                            <dd className="mt-1 text-base font-black text-white">{settings.scoreCap.toLocaleString("en-US")}</dd>
                        </div>
                    </dl>

                    {isLocalHost && (
                        <button
                            ref={changeSettingsButtonRef}
                            type="button"
                            onClick={onChangeSettings}
                            className={`rounded-full border ${palette.border} bg-white/[0.06] px-4 py-2 text-sm font-black text-white/75 transition hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55`}
                        >
                            Change
                        </button>
                    )}
                </div>
            </header>

            <section className="w-full min-w-0 self-start">
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

                    {localPlayer?.isReady && selectedDeck && (
                        <div className={`rounded-full border ${palette.border} ${palette.card} px-4 py-2 text-sm font-black text-white shadow-xl`}>
                            Ready with {selectedDeck.name}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 sm:justify-items-stretch sm:gap-5 2xl:grid-cols-3">
                    {decks.map(deck => (
                        <MultiplayerDeckCard
                            key={deck.id}
                            deck={deck}
                            selected={selectedDeck?.id === deck.id}
                            ready={selectedDeck?.id === deck.id && Boolean(localPlayer?.isReady)}
                            disabled={deck.words.length < minimumMultiplayerWords}
                            onSelect={() => onDeckSelect(deck)}
                            palette={palette}
                        />
                    ))}
                </div>
            </section>

            <aside className="mt-8 w-full min-[1400px]:hidden">
                <PlayersPanel
                    players={players}
                    currentHostId={currentHostId}
                    maxPlayers={maxPlayers}
                    isLocalHost={isLocalHost}
                    settingsVersion={settings.settingsVersion}
                    isStartingRace={roomActionBusy}
                    actionError={roomActionError}
                    onStartRace={onStartRace}
                    palette={palette}
                />
            </aside>
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
            className={`group relative h-full w-full max-w-[24rem] rounded-3xl text-left transition duration-200 sm:max-w-none ${disabled ? "cursor-not-allowed opacity-55" : "hover:-translate-y-1"}`}
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
                            <h3 className="line-clamp-2 break-words text-xl font-black text-white sm:text-2xl">{deck.name}</h3>
                            <div className="mt-2 flex items-center gap-2 text-sm font-bold text-white/72">
                                <Trophy size={19} strokeWidth={2.8} className={palette.accentText} />
                                {deck.highScore.toLocaleString("nb-NO")}
                            </div>
                        </div>
                        <div className="text-right leading-none">
                            <p className="text-4xl font-black text-white sm:text-5xl">{deck.words.length}</p>
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

function PlayersPanel({
    players,
    currentHostId,
    maxPlayers,
    isLocalHost,
    settingsVersion,
    isStartingRace,
    actionError,
    onStartRace,
    palette
}: {
    players: LobbyPlayer[]
    currentHostId: string | null
    maxPlayers: number
    isLocalHost: boolean
    settingsVersion: number
    isStartingRace: boolean
    actionError: string | null
    onStartRace: () => Promise<MultiplayerRoom | null>
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const connectedPlayers = players.filter(player => player.isConnected)
    const hasEnoughPlayers = connectedPlayers.length >= 2
    const allPlayersReady = hasEnoughPlayers && connectedPlayers.every(player =>
        player.isReady && player.readyForSettingsVersion === settingsVersion
    )

    return (
        <div className="h-fit w-full">
            <h2 className="text-2xl font-black text-white">Players {players.length}/{maxPlayers}</h2>

            <div className="mt-5 space-y-4">
                {players.map(player => (
                    <PlayerRow key={player.id} player={player} isCurrentHost={player.id === currentHostId} palette={palette} />
                ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
                {isLocalHost ? (
                    <>
                        <button
                            type="button"
                            onClick={() => void onStartRace()}
                            disabled={!allPlayersReady || isStartingRace}
                            className={`w-full rounded-full px-5 py-3 text-sm font-black transition ${allPlayersReady
                                ? `${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}`
                                : "cursor-not-allowed border border-white/10 bg-white/[0.06] text-white/35"
                            }`}
                        >
                            {isStartingRace ? "Starting..." : "Start Race"}
                        </button>
                        {!hasEnoughPlayers && (
                            <p className="mt-2 text-center text-xs font-bold text-white/45">Need at least 2 players</p>
                        )}
                        {hasEnoughPlayers && !allPlayersReady && (
                            <p className="mt-2 text-center text-xs font-bold text-white/45">Waiting for all players</p>
                        )}
                    </>
                ) : (
                    <p className="text-center text-xs font-bold text-white/48">Waiting for host to start</p>
                )}

                {actionError && (
                    <p className="mt-3 rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-center text-xs font-bold text-red-100">
                        {actionError}
                    </p>
                )}
            </div>
        </div>
    )
}

function PlayerRow({ player, isCurrentHost, palette }: {
    player: LobbyPlayer
    isCurrentHost: boolean
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const navigate = useNavigate()
    const location = useLocation()
    const { playHoverSound } = useUISound()
    const { appLanguage } = useI18n()
    const flagUrl = getCountryFlag(player.countryCode)
    const countryName = player.countryCode ? getCountryName(player.countryCode, appLanguage) : null
    const canOpenProfile = Boolean(player.profilePath)
    const rowClassName = `flex w-full items-center gap-3 rounded-2xl border border-transparent bg-transparent p-3 text-left transition duration-200 ${
        player.ready
            ? "hover:border-emerald-300/30 hover:bg-emerald-500/15 hover:shadow-[0_0_22px_rgba(52,211,153,0.12)] focus-visible:border-emerald-300/30 focus-visible:bg-emerald-500/15"
            : "hover:border-white/10 hover:bg-black/25 focus-visible:border-white/10 focus-visible:bg-black/25"
    } ${canOpenProfile ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35" : ""}`
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

            {flagUrl && <img src={flagUrl} alt={countryName ?? ""} title={countryName ?? undefined} className="h-5 w-8 rounded-sm object-cover shadow-lg" />}
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
