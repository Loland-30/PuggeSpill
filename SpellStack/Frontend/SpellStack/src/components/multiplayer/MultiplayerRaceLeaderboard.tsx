import { motion, useReducedMotion } from "framer-motion"

import ProfileImage from "../ProfileImage"
import { countries, getCountryName } from "../../data/countries"
import { useI18n } from "../../i18n/I18nContext"
import type { MultiplayerPlayer } from "../../multiplayer/multiplayerTypes"
import { resolveAssetUrl } from "../../utils/assetUrl"

function sortLeaderboard(players: MultiplayerPlayer[]) {
    return players
        .map((player, joinIndex) => ({ player, joinIndex }))
        .sort((left, right) => {
            if (right.player.raceScore !== left.player.raceScore) {
                return right.player.raceScore - left.player.raceScore
            }

            const leftSequence = left.player.scoreSequence || Number.MAX_SAFE_INTEGER
            const rightSequence = right.player.scoreSequence || Number.MAX_SAFE_INTEGER
            if (leftSequence !== rightSequence) return leftSequence - rightSequence
            return left.joinIndex - right.joinIndex
        })
}

export default function MultiplayerRaceLeaderboard({
    players,
    localUserId
}: {
    players: MultiplayerPlayer[]
    localUserId: string
}) {
    const prefersReducedMotion = useReducedMotion()
    const { appLanguage } = useI18n()
    const sortedPlayers = sortLeaderboard(players)

    return (
        <aside
            className="pointer-events-none fixed right-3 top-1/2 z-50 w-[min(21rem,calc(100vw-1.5rem))] -translate-y-1/2 sm:right-6"
            aria-label="Live Race leaderboard"
        >
            <div className="mb-3 px-2 text-white drop-shadow-lg">
                <h2 className="text-lg font-black">Race</h2>
            </div>

            <ol className="space-y-2">
                {sortedPlayers.map(({ player }, index) => {
                    const isLocalPlayer = player.userId === localUserId
                    const flag = player.countryCode
                        ? countries.find(country => country.code === player.countryCode?.toUpperCase())
                        : null
                    const countryName = player.countryCode
                        ? getCountryName(player.countryCode, appLanguage)
                        : null

                    return (
                        <motion.li
                            layout={!prefersReducedMotion}
                            transition={{ layout: { duration: 0.24, ease: "easeOut" } }}
                            key={player.userId}
                            className="pointer-events-auto flex items-center gap-3 px-3 py-2.5 text-white drop-shadow-[0_2px_7px_rgba(0,0,0,0.9)]"
                            aria-label={`${index + 1}. ${player.username}, ${player.raceScore} points${isLocalPlayer ? ", you" : ""}`}
                        >
                            <span className="w-5 shrink-0 text-center text-sm font-black text-white/70">{index + 1}</span>
                            <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white/15 text-sm font-black">
                                {player.username.slice(0, 1).toUpperCase()}
                                <ProfileImage
                                    src={resolveAssetUrl(player.profileImageUrl)}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black">
                                    {player.username}
                                    {isLocalPlayer && <span className="ml-1.5 text-[10px] uppercase tracking-wider text-white/55">(You)</span>}
                                </p>
                                <p className="text-xs font-bold text-white/55">
                                    {player.isFinished ? "Finished" : player.isConnected ? "Racing" : "Disconnected"}
                                </p>
                            </div>
                            {flag?.flagUrl && (
                                <img
                                    src={flag.flagUrl}
                                    alt={countryName ?? ""}
                                    title={countryName ?? undefined}
                                    className="h-4 w-6 rounded-sm object-cover"
                                />
                            )}
                            <span className="min-w-16 text-right text-sm font-black tabular-nums">
                                {player.raceScore.toLocaleString("en-US")}
                            </span>
                        </motion.li>
                    )
                })}
            </ol>
        </aside>
    )
}
