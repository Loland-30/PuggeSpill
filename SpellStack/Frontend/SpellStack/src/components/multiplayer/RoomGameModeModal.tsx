import { useCallback, useEffect, useState, type FormEvent } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Check, ChevronDown, Flag, Shield, X } from "lucide-react"

import { useUISound } from "../../audio/useUISound"
import type {
    MultiplayerGameModeId,
    MultiplayerRaceScoreCap,
    MultiplayerRoomSettings
} from "../../multiplayer/multiplayerTypes"
import type { PaletteTheme } from "../../theme/themes"
import AuthBackButton from "../auth/AuthBackButton"
import AuthPrimaryButton from "../auth/AuthPrimaryButton"
import GradientFrame from "../GradientFrame"
import useMobileNavigation from "../navigation/useMobileNavigation"

const raceScoreCaps: readonly MultiplayerRaceScoreCap[] = [10000, 50000, 100000, 200000]

interface RoomGameModeModalProps {
    isOpen: boolean
    settings: MultiplayerRoomSettings
    isLoading: boolean
    error: string | null
    palette: PaletteTheme
    onClose: () => void
    onConfirm: (gameModeId: MultiplayerGameModeId, scoreCap: MultiplayerRaceScoreCap) => Promise<unknown>
}

export default function RoomGameModeModal({
    isOpen,
    settings,
    isLoading,
    error,
    palette,
    onClose,
    onConfirm
}: RoomGameModeModalProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [gameModeId, setGameModeId] = useState<MultiplayerGameModeId | null>(settings.gameModeId)
    const [scoreCap, setScoreCap] = useState<MultiplayerRaceScoreCap>(settings.scoreCap)
    const [scoreMenuOpen, setScoreMenuOpen] = useState(false)
    const { playHoverSound } = useUISound()
    const { setHidden: setMobileNavigationHidden } = useMobileNavigation()
    const prefersReducedMotion = useReducedMotion()

    const handleClose = useCallback(() => {
        if (!isLoading) onClose()
    }, [isLoading, onClose])

    useEffect(() => {
        if (!isOpen) return

        setMobileNavigationHidden(true)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return

            if (scoreMenuOpen) {
                setScoreMenuOpen(false)
                return
            }

            handleClose()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.body.style.overflow = previousOverflow
            setMobileNavigationHidden(false)
        }
    }, [handleClose, isOpen, scoreMenuOpen, setMobileNavigationHidden])

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!gameModeId || isLoading) return

        try {
            await onConfirm(gameModeId, scoreCap)
        }
        catch {
            // The hook exposes the normalized error while preserving this pending selection.
        }
    }

    const transition = prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[900] grid place-items-center overflow-y-auto bg-black/70 px-3 py-5 backdrop-blur-sm sm:px-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={transition}
                    onMouseDown={handleClose}
                >
                    <motion.form
                        onSubmit={handleSubmit}
                        onMouseDown={event => event.stopPropagation()}
                        className="relative w-full max-w-5xl px-2 py-8 sm:px-6 sm:py-12"
                        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.97, y: prefersReducedMotion ? 0 : 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.98, y: prefersReducedMotion ? 0 : 8 }}
                        transition={transition}
                        aria-labelledby="room-game-mode-heading"
                    >
                        <button
                            type="button"
                            onClick={handleClose}
                            onMouseEnter={playHoverSound}
                            disabled={isLoading}
                            className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-40 sm:right-5 sm:top-5"
                            aria-label="Close game mode settings"
                        >
                            <X size={23} strokeWidth={2.6} />
                        </button>

                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 18 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -18 }}
                                transition={transition}
                            >
                                {step === 1 ? (
                                    <GameModeStep
                                        gameModeId={gameModeId}
                                        palette={palette}
                                        onSelect={setGameModeId}
                                        onAdvance={() => setStep(2)}
                                    />
                                ) : (
                                    <ScoreStep
                                        scoreCap={scoreCap}
                                        scoreMenuOpen={scoreMenuOpen}
                                        isLoading={isLoading}
                                        error={error}
                                        palette={palette}
                                        onScoreMenuToggle={() => setScoreMenuOpen(open => !open)}
                                        onScoreSelect={option => {
                                            setScoreCap(option)
                                            setScoreMenuOpen(false)
                                        }}
                                        onReturn={() => {
                                            setScoreMenuOpen(false)
                                            setStep(1)
                                        }}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function GameModeStep({ gameModeId, palette, onSelect, onAdvance }: {
    gameModeId: MultiplayerGameModeId | null
    palette: PaletteTheme
    onSelect: (gameModeId: MultiplayerGameModeId) => void
    onAdvance: () => void
}) {
    const { playHoverSound } = useUISound()

    return (
        <section>
            <header className="text-center">
                <h2 id="room-game-mode-heading" className="text-3xl font-black text-white sm:text-5xl">
                    Select game mode
                </h2>
                <p className="mt-3 text-sm font-semibold text-white/52 sm:text-base">
                    The selected mode is shared with everyone in the room.
                </p>
            </header>

            <div className="mx-auto mt-9 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <GradientFrame
                    glow={gameModeId === "race"}
                    glass
                    radius={24}
                    radiusClass="rounded-3xl"
                    className="h-full"
                    contentClassName="h-full rounded-[inherit]"
                >
                    <button
                        type="button"
                        onClick={() => onSelect("race")}
                        onMouseEnter={playHoverSound}
                        aria-pressed={gameModeId === "race"}
                        className="flex min-h-44 w-full flex-col items-center justify-center rounded-[inherit] p-6 text-center transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/55"
                    >
                        <Flag size={31} strokeWidth={2.7} className={palette.accentText} />
                        <span className="mt-4 text-2xl font-black text-white">Race</span>
                        <span className="mt-2 max-w-52 text-sm font-semibold leading-5 text-white/55">
                            Be the first player to reach the target score.
                        </span>
                        {gameModeId === "race" && (
                            <span className={`mt-4 grid h-7 w-7 place-items-center rounded-full ${palette.primaryButton} ${palette.primaryButtonText}`}>
                                <Check size={16} strokeWidth={3.2} />
                            </span>
                        )}
                    </button>
                </GradientFrame>

                <GradientFrame
                    glass
                    radius={24}
                    radiusClass="rounded-3xl"
                    className="h-full opacity-45"
                    contentClassName="h-full rounded-[inherit]"
                >
                    <div
                        className="flex min-h-44 w-full cursor-not-allowed flex-col items-center justify-center rounded-[inherit] p-6 text-center"
                        aria-disabled="true"
                    >
                        <Shield size={31} strokeWidth={2.7} className="text-white/50" />
                        <span className="mt-4 text-2xl font-black text-white">Battle</span>
                        <span className="mt-2 text-sm font-semibold text-white/50">Coming later</span>
                    </div>
                </GradientFrame>
            </div>

            <div className="mt-10 flex justify-center">
                <AuthPrimaryButton
                    text="Advance"
                    ariaLabel="Advance to score selection"
                    onClick={onAdvance}
                    disabled={!gameModeId}
                />
            </div>
        </section>
    )
}

function ScoreStep({ scoreCap, scoreMenuOpen, isLoading, error, palette, onScoreMenuToggle, onScoreSelect, onReturn }: {
    scoreCap: MultiplayerRaceScoreCap
    scoreMenuOpen: boolean
    isLoading: boolean
    error: string | null
    palette: PaletteTheme
    onScoreMenuToggle: () => void
    onScoreSelect: (scoreCap: MultiplayerRaceScoreCap) => void
    onReturn: () => void
}) {
    const { playHoverSound } = useUISound()

    return (
        <section>
            <header className="text-center">
                <h2 id="room-game-mode-heading" className="text-3xl font-black text-white sm:text-5xl">
                    Select score
                </h2>
                <p className="mt-3 text-sm font-semibold text-white/52 sm:text-base">
                    The first player to reach this score wins the Race.
                </p>
            </header>

            <div className="relative mx-auto mt-9 w-full max-w-md">
                <button
                    type="button"
                    onClick={onScoreMenuToggle}
                    onMouseEnter={playHoverSound}
                    disabled={isLoading}
                    aria-label="Select Race score cap"
                    aria-expanded={scoreMenuOpen}
                    className={`flex min-h-24 w-full items-center rounded-3xl border ${palette.border} ${palette.card} ${palette.glow} px-7 text-left text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 disabled:cursor-wait disabled:opacity-55`}
                >
                    <span className="flex-1 text-center text-3xl font-black sm:text-4xl">
                        {scoreCap.toLocaleString("en-US")}
                    </span>
                    <ChevronDown
                        size={24}
                        strokeWidth={3}
                        className={`shrink-0 transition duration-300 ${scoreMenuOpen ? "rotate-180" : ""}`}
                    />
                </button>

                <AnimatePresence>
                    {scoreMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className={`absolute left-0 right-0 top-[calc(100%+0.75rem)] z-10 overflow-hidden rounded-3xl border ${palette.border} ${palette.card} ${palette.glow} p-2 shadow-2xl`}
                        >
                            {raceScoreCaps.map(option => {
                                const selected = option === scoreCap

                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => onScoreSelect(option)}
                                        onMouseEnter={playHoverSound}
                                        className={`flex w-full items-center justify-between rounded-2xl px-5 py-3 text-left text-base font-black transition ${
                                            selected
                                                ? `${palette.primaryButton} ${palette.primaryButtonText}`
                                                : "text-white hover:bg-white/[0.08]"
                                        }`}
                                    >
                                        {option.toLocaleString("en-US")}
                                        {selected && <Check size={18} strokeWidth={3} />}
                                    </button>
                                )
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <p role="alert" aria-live="polite" className={`mx-auto mt-5 min-h-5 max-w-md text-center text-sm font-bold ${error ? "text-red-200" : "text-white/45"}`}>
                {error ?? (isLoading ? "Updating room settings..." : "Everyone in the room will see this target.")}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <AuthBackButton
                    text="Return"
                    ariaLabel="Return to game mode selection"
                    onClick={onReturn}
                    disabled={isLoading}
                />
                <AuthPrimaryButton
                    text="Confirm"
                    ariaLabel="Confirm room game settings"
                    type="submit"
                    variant="pill"
                    disabled={isLoading}
                    loading={isLoading}
                />
            </div>
        </section>
    )
}
