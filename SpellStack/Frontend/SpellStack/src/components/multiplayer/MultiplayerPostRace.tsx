import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { countries } from "../../data/countries"
import { languages } from "../../data/languages"
import type { MultiplayerPlayer, MultiplayerRoom } from "../../multiplayer/multiplayerTypes"
import { resolveAssetUrl } from "../../utils/assetUrl"
import ProfileImage from "../ProfileImage"
import ThemedPage from "../ThemedPage"
import MultiplayerResultRing from "./MultiplayerResultRing"

const WINNER_SPLASH_MS = 2000
const RESULT_ITEM_DURATION_SECONDS = 0.24
const STAT_ENTRANCE_DELAY_SECONDS = 0.08
const STANDINGS_ENTRANCE_DELAY_SECONDS = 0.05

interface MultiplayerPostRaceProps {
    room: MultiplayerRoom
    localPlayer: MultiplayerPlayer
    onReturnToLobby: () => Promise<unknown>
    isReturning: boolean
}

export default function MultiplayerPostRace({
    room,
    localPlayer,
    onReturnToLobby,
    isReturning
}: MultiplayerPostRaceProps) {
    const reduceMotion = useReducedMotion()
    const [showSplash, setShowSplash] = useState(() => !reduceMotion && !localPlayer.hasReturnedToLobby)
    const winner = room.players.find(player => player.userId === room.race?.winnerUserId) ?? null

    useEffect(() => {
        if (!showSplash) return
        const timer = window.setTimeout(() => setShowSplash(false), WINNER_SPLASH_MS)
        return () => window.clearTimeout(timer)
    }, [showSplash])

    if (!winner) return null

    return (
        <ThemedPage className="text-white">
            {showSplash ? (
                <WinnerSplash winner={winner} />
            ) : (
                <MultiplayerResults
                    room={room}
                    localPlayer={localPlayer}
                    winner={winner}
                    onReturnToLobby={onReturnToLobby}
                    isReturning={isReturning}
                />
            )}
        </ThemedPage>
    )
}

function WinnerSplash({ winner }: { winner: MultiplayerPlayer }) {
    const flag = getCountryFlag(winner.countryCode)

    return (
        <motion.main
            className="grid min-h-dvh place-items-center bg-black/45 px-5 text-center"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            <div>
                <p className="text-3xl font-black tracking-[0.12em] sm:text-5xl">WINNER</p>
                <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:text-left">
                    <PlayerAvatar player={winner} className="h-36 w-36 sm:h-48 sm:w-48" />
                    <div>
                        <div className="flex items-center justify-center gap-4 sm:justify-start">
                            <h1 className="max-w-[70vw] [overflow-wrap:anywhere] text-4xl font-black sm:text-6xl">{winner.username}</h1>
                            {flag && <img src={flag} alt="" className="h-8 w-12 rounded object-cover sm:h-10 sm:w-16" />}
                        </div>
                        <p className="mt-2 text-2xl font-bold tabular-nums sm:text-4xl">{winner.raceScore.toLocaleString("en-US")}</p>
                    </div>
                </div>
            </div>
        </motion.main>
    )
}

function MultiplayerResults({
    room,
    localPlayer,
    winner,
    onReturnToLobby,
    isReturning
}: MultiplayerPostRaceProps & { winner: MultiplayerPlayer }) {
    const reduceMotion = useReducedMotion()
    const standings = useMemo(() => room.players
        .filter(player => player.userId !== winner.userId && (player.isFinished || player.isDnf))
        .sort((left, right) => {
            if (left.isDnf !== right.isDnf) return left.isDnf ? 1 : -1
            return (left.placement ?? Number.MAX_SAFE_INTEGER) - (right.placement ?? Number.MAX_SAFE_INTEGER)
        }), [room.players, winner.userId])
    const language = languages.find(candidate => candidate.code === localPlayer.deckLanguage)
    const transition = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" as const }

    return (
        <main className="min-h-dvh bg-black/45 px-5 py-8 sm:px-8 lg:grid lg:grid-cols-[minmax(15rem,0.78fr)_minmax(30rem,1.35fr)_minmax(20rem,0.92fr)] lg:items-center lg:gap-[clamp(2rem,4vw,6rem)] xl:px-[clamp(3.5rem,4vw,6rem)]">
            <section
                className="mx-auto w-full max-w-md lg:mx-0 lg:flex lg:min-h-[calc(100dvh-4rem)] lg:flex-col lg:self-start"
            >
                <div className="w-full border-b border-white/25 pb-5 lg:max-w-sm">
                    <div className="flex items-center gap-3">
                        <h1 className="[overflow-wrap:anywhere] text-3xl font-black sm:text-4xl">{localPlayer.selectedDeckName}</h1>
                        {language?.flagUrl && <img src={language.flagUrl} alt="" className="h-8 w-12 rounded object-cover" />}
                    </div>
                    <p className="mt-2 text-lg font-bold text-white">{localPlayer.deckWordCount ?? 0} words</p>
                    <p className="mt-1 text-lg font-bold text-white">Race</p>
                </div>

                <dl className="mt-12 space-y-9 lg:my-auto lg:space-y-8">
                    <ResultStat label="Best streak" value={localPlayer.bestStreak} index={0} reduceMotion={reduceMotion} />
                    <ResultStat label="Kills" value={localPlayer.kills} index={1} reduceMotion={reduceMotion} />
                    <ResultStat label="Rush Hours" value={localPlayer.rushHoursTriggered} index={2} reduceMotion={reduceMotion} />
                </dl>
            </section>

            <motion.section
                className="my-10 flex min-w-0 flex-col items-center lg:relative lg:-top-4 lg:my-0"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...transition, delay: reduceMotion ? 0 : 0.08 }}
            >
                <MultiplayerResultRing accuracy={localPlayer.finalAccuracy} />
                <p className="mt-10 text-5xl font-black tabular-nums sm:text-6xl">
                    {localPlayer.raceScore.toLocaleString("en-US")}
                </p>
                <button
                    type="button"
                    onClick={() => void onReturnToLobby()}
                    disabled={isReturning || localPlayer.hasReturnedToLobby}
                    className="mt-10 rounded-full bg-white px-7 py-3 font-black text-black transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60"
                >
                    {localPlayer.hasReturnedToLobby ? "Waiting for players..." : isReturning ? "Returning..." : "Return to lobby"}
                </button>
            </motion.section>

            <section
                className="mx-auto w-full max-w-md lg:relative lg:-top-8 lg:mx-0 lg:justify-self-end"
            >
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={reduceMotion
                        ? { duration: 0 }
                        : {
                            duration: RESULT_ITEM_DURATION_SECONDS,
                            delay: STANDINGS_ENTRANCE_DELAY_SECONDS,
                            ease: "easeOut"
                        }}
                >
                    <p className="text-3xl font-black tracking-[0.12em] sm:text-4xl">WINNER</p>
                    <FeaturedPlayer player={winner} />
                </motion.div>
                <ol className="mt-10 space-y-5">
                    {standings.map((player, index) => (
                        <motion.li
                            key={player.userId}
                            className="flex items-center gap-4"
                            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={reduceMotion
                                ? { duration: 0 }
                                : {
                                    duration: RESULT_ITEM_DURATION_SECONDS,
                                    delay: STANDINGS_ENTRANCE_DELAY_SECONDS + (index + 1) * RESULT_ITEM_DURATION_SECONDS,
                                    ease: "easeOut"
                                }}
                        >
                            <span className="w-10 text-center text-sm font-black text-white/65">
                                {player.isDnf ? "DNF" : player.placement}
                            </span>
                            <PlayerAvatar player={player} className="h-14 w-14" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-lg font-black">{player.username}</p>
                                <p className="text-sm font-bold text-white">
                                    {player.isDnf ? "Did not finish" : player.raceScore.toLocaleString("en-US")}
                                </p>
                            </div>
                            {getCountryFlag(player.countryCode) && (
                                <img src={getCountryFlag(player.countryCode)!} alt="" className="h-5 w-7 rounded-sm object-cover" />
                            )}
                        </motion.li>
                    ))}
                </ol>
            </section>
        </main>
    )
}

function ResultStat({
    label,
    value,
    index,
    reduceMotion
}: {
    label: string
    value: number
    index: number
    reduceMotion: boolean | null
}) {
    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reduceMotion
                ? { duration: 0 }
                : {
                    duration: RESULT_ITEM_DURATION_SECONDS,
                    delay: STAT_ENTRANCE_DELAY_SECONDS + index * RESULT_ITEM_DURATION_SECONDS,
                    ease: "easeOut"
                }}
        >
            <dt className="text-lg font-black text-white sm:text-xl">{label}</dt>
            <dd className="mt-1 text-[clamp(4.5rem,5vw,6rem)] font-black leading-none tabular-nums">{value}</dd>
        </motion.div>
    )
}

function FeaturedPlayer({ player }: { player: MultiplayerPlayer }) {
    const flag = getCountryFlag(player.countryCode)
    return (
        <div className="mt-6 flex items-center gap-5">
            <PlayerAvatar player={player} className="h-28 w-28 sm:h-32 sm:w-32" />
            <div className="min-w-0">
                <div className="flex items-center gap-4">
                    <p className="truncate text-3xl font-black sm:text-4xl">{player.username}</p>
                    {flag && <img src={flag} alt="" className="h-7 w-11 rounded-sm object-cover sm:h-8 sm:w-12" />}
                </div>
                <p className="mt-2 text-xl font-bold tabular-nums text-white sm:text-2xl">{player.raceScore.toLocaleString("en-US")}</p>
            </div>
        </div>
    )
}

function PlayerAvatar({ player, className }: { player: MultiplayerPlayer; className: string }) {
    return (
        <div className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-white/15 text-2xl font-black ${className}`}>
            {player.username.slice(0, 1).toUpperCase()}
            <ProfileImage
                src={resolveAssetUrl(player.profileImageUrl)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
            />
        </div>
    )
}

function getCountryFlag(countryCode: string | null) {
    return countries.find(country => country.code === countryCode?.toUpperCase())?.flagUrl ?? null
}
