import { useState, useEffect, useRef, type ReactNode } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"

import { getDeck, type Deck } from "../api/decks"
import { completeRushHour, endGame, answerWord, recordRushHourStart, startGame, type ActiveGameModifier, type GameDirection, type GameSession, type ResolvedDirection, type RoundLimit } from "../api/gameSession"
import AnswerPanel from "../components/game/AnswerPanel"
import EnemyStage from "../components/game/EnemyStage"
import GameHud from "../components/game/GameHud"
import PlayLoadingScreen from "../components/game/PlayLoadingScreen"
import RunResultScreen from "../components/game/RunResultScreen"
import RushHourNotice from "../components/game/RushHourNotice"
import GameModeModal from "../components/GameModeModal"
import type { ActiveEnemy } from "../data/enemies/enemyTypes"
import { useZoneRun } from "../hooks/useZoneRun"
import { cacheGameImages } from "../utils/gameImageCache"
import { isAnswerAccepted, splitAcceptedAnswers } from "../utils/answerUtils"
import correctSoundUrl from "../assets/SFX/correct_sound.mp3"
import correctSoundTwoUrl from "../assets/SFX/correct_2.mp3"
import gameStartCountdownUrl from "../assets/SFX/game_start_countdown.mp3"
import gameOverMusicUrl from "../assets/SFX/game_over_music.mp3"
import incorrectSoundOneUrl from "../assets/SFX/incorrect_1.mp3"
import incorrectSoundTwoUrl from "../assets/SFX/incorrect_2.mp3"
import { useAchievementNotifications } from "../achievements/AchievementNotificationContext"

const TIMER_DURATION = 10
const BOSS_TIMER_DURATION = 20
const RUSH_TRIGGER_COUNT = 10
const RUSH_FAST_ANSWER_MS = 3000
const RUSH_START_SECONDS = 4
const RUSH_REFILL_SECONDS = 4
const RUSH_TICK_MS = 500
const RUSH_BONUS_MULTIPLIER = 2.5
const END_TRANSITION_DURATION_MS = 2500
const MOMENTUM_TIMER_CAP = 10
const MOMENTUM_REFILL_SECONDS = 4
const MOMENTUM_RECOVERY_SECONDS_AFTER_LIFE_LOSS = 7
const MOMENTUM_STACK_INTERVAL = 5
const MOMENTUM_MAX_STACKS = 5
const MOMENTUM_TIMER_DRAIN_MULTIPLIERS = [1, 1.1, 1.25, 1.45, 1.7, 2] as const

type EndTransitionPhase = "playing" | "end-flash" | "results"
type RunEndOutcome = "complete" | "failed" | null

export interface MultiplayerPlayContext {
    deckId: number
    direction: GameDirection
    modifiers: ActiveGameModifier[]
    raceId: string
    startsAtUtc: string
    answerSequenceStart: number
    isFinished: boolean
    isDnf: boolean
    winnerName: string | null
    overlay: ReactNode
}

interface RunStats {
    totalAnswers: number
    correctAnswers: number
    bestStreak: number
}


function resolveDirection(direction: GameDirection): ResolvedDirection {
    if (direction === "mixed") return Math.random() > 0.5 ? "original" : "translation"
    return direction
}

function resolveModifiers(mods: string | null, legacyModifier: string | null): ActiveGameModifier[] {
    const rawMods = mods ? mods.split(",") : legacyModifier ? [legacyModifier] : []
    const parsedMods = rawMods.filter((modifier): modifier is ActiveGameModifier =>
        modifier === "zen" || modifier === "extraHeart" || modifier === "hardcore" || modifier === "momentum" || modifier === "hidden" || modifier === "noTime"
    )

    const uniqueMods = Array.from(new Set(parsedMods))
    return uniqueMods.includes("zen")
        ? uniqueMods.filter(modifier => modifier !== "momentum" && modifier !== "noTime")
        : uniqueMods
}

function resolveRoundLimit(value: string | null): RoundLimit {
    if (value === "endless") return null

    const parsed = Number(value)
    if (parsed === 10 || parsed === 25 || parsed === 50 || parsed === 100) return parsed

    return 25
}

function getTimerDuration(modifiers: ActiveGameModifier[], isBossEncounter: boolean) {
    if (isBossEncounter) return BOSS_TIMER_DURATION
    if (modifiers.includes("hardcore")) return 6
    if (modifiers.includes("zen")) return 15
    return TIMER_DURATION
}

function getMomentumStacks(streakCount: number) {
    return Math.min(MOMENTUM_MAX_STACKS, Math.floor(streakCount / MOMENTUM_STACK_INTERVAL))
}

function getMomentumTimerTickMs(stacks: number) {
    const multiplier = MOMENTUM_TIMER_DRAIN_MULTIPLIERS[stacks] ?? MOMENTUM_TIMER_DRAIN_MULTIPLIERS[0]
    return Math.max(120, Math.round(1000 / multiplier))
}

function getMaxLives(modifiers: ActiveGameModifier[]) {
    if (modifiers.includes("hardcore")) return 1

    let lives = 3
    if (modifiers.includes("zen")) lives = 4
    if (modifiers.includes("extraHeart")) lives += 1
    return lives
}


function playSound(audio: HTMLAudioElement, volume = 1) {
    audio.pause()
    audio.currentTime = 0
    audio.volume = volume
    audio.play().catch(() => undefined)
}

function preloadAudio(audio: HTMLAudioElement) {
    if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve()

    audio.preload = "auto"

    return new Promise<void>(resolve => {
        const cleanup = () => {
            audio.removeEventListener("loadeddata", handleReady)
            audio.removeEventListener("canplaythrough", handleReady)
            audio.removeEventListener("error", handleReady)
        }

        const handleReady = () => {
            cleanup()
            resolve()
        }

        audio.addEventListener("loadeddata", handleReady, { once: true })
        audio.addEventListener("canplaythrough", handleReady, { once: true })
        audio.addEventListener("error", handleReady, { once: true })
        audio.load()
    })
}

function preloadAudioElements(audioElements: Array<HTMLAudioElement | null | undefined>) {
    return Promise.all(audioElements.filter((audio): audio is HTMLAudioElement => Boolean(audio)).map(preloadAudio)).then(() => undefined)
}


export default function PlayPage({ multiplayerRace }: { multiplayerRace?: MultiplayerPlayContext }) {
    const { id: routeDeckId } = useParams()
    const id = String(multiplayerRace?.deckId ?? routeDeckId ?? "")
    const navigate = useNavigate()
    const prefersReducedMotion = useReducedMotion()
    const { showAchievements } = useAchievementNotifications()
    const [searchParams] = useSearchParams()
    const selectedDirection = multiplayerRace?.direction ?? (searchParams.get("direction") ?? "original") as GameDirection
    const selectedModifiers = multiplayerRace?.modifiers ?? resolveModifiers(searchParams.get("mods"), searchParams.get("modifier"))
    const selectedModifierKey = selectedModifiers.join(",")
    const selectedRoundLimit = multiplayerRace ? null : resolveRoundLimit(searchParams.get("roundLimit"))
    const selectedRoundLimitKey = selectedRoundLimit ?? "endless"
    const {
        currentZone,
        currentEncounterIndex,
        currentEnemy,
        isBossEncounter,
        streak,
        enemiesKilled,
        onCorrectAnswer,
        onWrongAnswer,
        resetZoneRun
    } = useZoneRun()
    const timerDuration = getTimerDuration(selectedModifiers, isBossEncounter)
    const maxLives = getMaxLives(selectedModifiers)

    const [session, setSession] = useState<GameSession | null>(null)
    const [result, setResult] = useState<"correct" | "incorrect" | null>(null)
    const [gameOver, setGameOver] = useState(false)
    const [runComplete, setRunComplete] = useState(false)
    const [highScore, setHighScore] = useState<number | null>(null)
    const [isNewHighScore, setIsNewHighScore] = useState(false)
    const [currentDirection, setCurrentDirection] = useState<ResolvedDirection>(() => resolveDirection(selectedDirection))
    const [stats, setStats] = useState<RunStats>({ totalAnswers: 0, correctAnswers: 0, bestStreak: 0 })
    const [fastCorrectCount, setFastCorrectCount] = useState(0)
    const [rushActive, setRushActive] = useState(false)
    const [rushAnswers, setRushAnswers] = useState(0)
    const [rushBonusFlash, setRushBonusFlash] = useState(false)
    const [scoreDelta, setScoreDelta] = useState<number | null>(null)
    const [stageAssetsReady, setStageAssetsReady] = useState(false)
    const [startCountdown, setStartCountdown] = useState<number | null>(3)
    const [deck, setDeck] = useState<Deck | null>(null)
    const [setupModalOpen, setSetupModalOpen] = useState(false)
    const [endTransitionPhase, setEndTransitionPhase] = useState<EndTransitionPhase>("playing")
    const [runEndOutcome, setRunEndOutcome] = useState<RunEndOutcome>(null)
    const [visualEnemyOverride, setVisualEnemyOverride] = useState<ActiveEnemy | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)
    const shouldResetTimerRef = useRef(true)
    const timeLeftRef = useRef(timerDuration)
    const wordStartedAtRef = useRef(Date.now())
    const rushActiveRef = useRef(false)
    const rushScoreStartRef = useRef(0)
    const rushStartedAtRef = useRef<number | null>(null)
    const correctSoundRefs = useRef<HTMLAudioElement[] | null>(null)
    const incorrectSoundRefs = useRef<HTMLAudioElement[] | null>(null)
    const countdownSoundRef = useRef<HTMLAudioElement | null>(null)
    const countdownSoundStartedRef = useRef(false)
    const gameOverMusicRef = useRef<HTMLAudioElement | null>(null)
    const endTransitionTimerRef = useRef<number | null>(null)
    const visualEnemyTimerRef = useRef<number | null>(null)
    const multiplayerAnswerSequenceRef = useRef(0)

    const clearEndTransitionTimer = () => {
        if (endTransitionTimerRef.current === null) return

        window.clearTimeout(endTransitionTimerRef.current)
        endTransitionTimerRef.current = null
    }

    const resetEndTransition = () => {
        clearEndTransitionTimer()
        setEndTransitionPhase("playing")
        setRunEndOutcome(null)
    }

    const clearVisualEnemyTimer = () => {
        if (visualEnemyTimerRef.current === null) return

        window.clearTimeout(visualEnemyTimerRef.current)
        visualEnemyTimerRef.current = null
    }

    const showDefeatedEnemy = (enemy: ActiveEnemy) => {
        clearVisualEnemyTimer()
        setVisualEnemyOverride({ ...enemy, hp: 0 })
        visualEnemyTimerRef.current = window.setTimeout(() => {
            setVisualEnemyOverride(null)
            visualEnemyTimerRef.current = null
        }, 520)
    }

    const startEndTransition = (outcome: Exclude<RunEndOutcome, null>) => {
        clearEndTransitionTimer()
        setRunEndOutcome(outcome)

        if (prefersReducedMotion) {
            setEndTransitionPhase("results")
            return
        }

        setEndTransitionPhase("end-flash")

        endTransitionTimerRef.current = window.setTimeout(() => {
            setEndTransitionPhase("results")
            endTransitionTimerRef.current = null
        }, END_TRANSITION_DURATION_MS)
    }

    if (correctSoundRefs.current === null) {
        correctSoundRefs.current = [
            new Audio(correctSoundUrl),
            new Audio(correctSoundTwoUrl)
        ]
    }

    if (incorrectSoundRefs.current === null) {
        incorrectSoundRefs.current = [
            new Audio(incorrectSoundOneUrl),
            new Audio(incorrectSoundTwoUrl)
        ]
    }

    if (gameOverMusicRef.current === null) {
        gameOverMusicRef.current = new Audio(gameOverMusicUrl)
    }

    if (countdownSoundRef.current === null) {
        countdownSoundRef.current = new Audio(gameStartCountdownUrl)
    }

    useEffect(() => {
        const gameOverMusic = gameOverMusicRef.current
        const countdownSound = countdownSoundRef.current
        const correctSounds = correctSoundRefs.current
        const incorrectSounds = incorrectSoundRefs.current

        return () => {
            clearEndTransitionTimer()
            clearVisualEnemyTimer()
            gameOverMusic?.pause()
            countdownSound?.pause()
            correctSounds?.forEach(sound => sound.pause())
            incorrectSounds?.forEach(sound => sound.pause())
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        setStageAssetsReady(false)

        Promise.all([
            cacheGameImages(),
            preloadAudioElements([
                countdownSoundRef.current,
                gameOverMusicRef.current,
                ...(correctSoundRefs.current ?? []),
                ...(incorrectSoundRefs.current ?? [])
            ])
        ]).then(() => {
            if (!cancelled) setStageAssetsReady(true)
        })

        return () => {
            cancelled = true
        }
    }, [])
    useEffect(() => {
        if (!id) return

        let cancelled = false

        getDeck(Number(id))
            .then(nextDeck => {
                if (!cancelled) setDeck(nextDeck)
            })
            .catch(error => {
                console.error("Kunne ikke hente deck for resultatvisning", error)
            })

        return () => {
            cancelled = true
        }
    }, [id])

    useEffect(() => {
        let cancelled = false

        startGame(Number(id), selectedModifiers, selectedRoundLimit).then(s => {
            if (cancelled) return

            resetZoneRun()
            endRushHour()
            setSession(s)
            setHighScore(s.finalScore)
            setResult(null)
            setGameOver(false)
            setRunComplete(false)
            resetEndTransition()
            setIsNewHighScore(false)
            setScoreDelta(null)
            countdownSoundStartedRef.current = false
            const raceCountdown = multiplayerRace
                ? Math.max(0, Math.ceil((Date.parse(multiplayerRace.startsAtUtc) - Date.now()) / 1000))
                : 3
            setStartCountdown(raceCountdown > 0 ? raceCountdown : null)
            multiplayerAnswerSequenceRef.current = multiplayerRace?.answerSequenceStart ?? 0
            setStats({ totalAnswers: 0, correctAnswers: 0, bestStreak: 0 })
            setFastCorrectCount(0)
            setCurrentDirection(resolveDirection(selectedDirection))
            setVisualEnemyOverride(null)
            clearVisualEnemyTimer()
            shouldResetTimerRef.current = true
            timeLeftRef.current = timerDuration
            const gameOverMusic = gameOverMusicRef.current
            if (gameOverMusic) {
                gameOverMusic.pause()
                gameOverMusic.currentTime = 0
            }
        }).catch(error => {
            console.error("Kunne ikke starte spill", error)
        })

        return () => {
            cancelled = true
        }
    }, [id, selectedDirection, selectedModifierKey, selectedRoundLimitKey, multiplayerRace?.raceId, multiplayerRace?.startsAtUtc])


    useEffect(() => {
        if (!session || !stageAssetsReady || gameOver || runComplete || startCountdown === null) return

        if (multiplayerRace) {
            let previousCountdown = startCountdown
            const updateCountdown = () => {
                const remaining = Math.max(0, Math.ceil((Date.parse(multiplayerRace.startsAtUtc) - Date.now()) / 1000))
                if (remaining !== previousCountdown && remaining > 0) {
                    previousCountdown = remaining
                    setStartCountdown(remaining)
                    if (countdownSoundRef.current) playSound(countdownSoundRef.current, 0.75)
                }

                if (remaining <= 0) {
                    setStartCountdown(null)
                }
            }

            updateCountdown()
            const intervalId = window.setInterval(updateCountdown, 100)
            return () => window.clearInterval(intervalId)
        }

        if (countdownSoundStartedRef.current) return

        countdownSoundStartedRef.current = true

        const countdownSound = countdownSoundRef.current
        const playCountdownTick = () => {
            if (countdownSound) playSound(countdownSound, 0.75)
        }

        setStartCountdown(3)
        playCountdownTick()

        const timers = [
            window.setTimeout(() => {
                setStartCountdown(2)
                playCountdownTick()
            }, 1000),
            window.setTimeout(() => {
                setStartCountdown(1)
                playCountdownTick()
            }, 2000),
            window.setTimeout(() => {
                setStartCountdown(null)
                countdownSoundStartedRef.current = false
            }, 3000)
        ]

        return () => {
            timers.forEach(timer => window.clearTimeout(timer))
            countdownSound?.pause()
            countdownSoundStartedRef.current = false
        }
    }, [session?.id, stageAssetsReady, gameOver, runComplete, multiplayerRace?.raceId, multiplayerRace?.startsAtUtc])
    useEffect(() => {
        if (!session || !stageAssetsReady || startCountdown !== null || gameOver || runComplete) return
        setCurrentDirection(resolveDirection(selectedDirection))
        wordStartedAtRef.current = Date.now()

        if (shouldResetTimerRef.current) {
            timeLeftRef.current = timerDuration
        }

        shouldResetTimerRef.current = true
    }, [session?.currentWordId, session?.questionsAnswered, stageAssetsReady, startCountdown, rushActive, currentEnemy.enemyType, runComplete, selectedDirection, timerDuration])

    const stopTimer = () => undefined
    const handleGameOver = async (finishedSession: GameSession) => {
        stopTimer()
        setGameOver(true)
        const gameOverMusic = gameOverMusicRef.current
        if (gameOverMusic) playSound(gameOverMusic, 0.75)
        try {
            const result = await endGame(finishedSession.id)
            setHighScore(result.highScore)
            setIsNewHighScore(result.isNewHighScore)
            showAchievements(result.newlyUnlockedAchievements)
        } catch (error) {
            console.error("Kunne ikke oppdatere high score", error)
        }
        if (!multiplayerRace) {
            startEndTransition("failed")
        }
    }

    const handleRunComplete = async (finishedSession: GameSession) => {
        stopTimer()
        endRushHour()
        setRunComplete(true)
        try {
            const result = await endGame(finishedSession.id)
            setHighScore(result.highScore)
            setIsNewHighScore(result.isNewHighScore)
            showAchievements(result.newlyUnlockedAchievements)
        } catch (error) {
            console.error("Kunne ikke oppdatere high score", error)
        }
        startEndTransition("complete")
    }

    const isLocallyCorrect = (answer: string) => {
        if (!session) return false

        if (currentDirection === "translation") {
            return isAnswerAccepted(
                answer,
                session.currentWord.original,
                splitAcceptedAnswers(session.currentWord.alternativeOriginal)
            )
        }

        return isAnswerAccepted(
            answer,
            session.currentWord.translation,
            splitAcceptedAnswers(session.currentWord.alternativeTranslation)
        )
    }

    const handleSubmit = async (submittedAnswer: string, timedOut = false) => {
        if (result || gameOver || runComplete || multiplayerRace?.isFinished || !session) return
        const isRushActive = rushActiveRef.current
        const submittedTimeLeft = timedOut ? 0 : timeLeftRef.current
        const answer = timedOut ? "" : submittedAnswer
        const localCorrect = !timedOut && isLocallyCorrect(answer)
        const answerTimeMs = Date.now() - wordStartedAtRef.current
        const responseTimeSeconds = answerTimeMs / 1000
        const rushHourElapsedSeconds = isRushActive && rushStartedAtRef.current !== null
            ? (Date.now() - rushStartedAtRef.current) / 1000
            : undefined

        stopTimer()
        setScoreDelta(null)
        setResult(localCorrect ? "correct" : "incorrect")
        if (localCorrect) {
            const sounds = correctSoundRefs.current
            if (sounds && sounds.length > 0) {
                const sound = sounds[Math.floor(Math.random() * sounds.length)]
                playSound(sound, rushActiveRef.current ? 0.9 : 0.7)
            }
        } else {
            const sounds = incorrectSoundRefs.current
            if (sounds && sounds.length > 0) {
                const sound = sounds[Math.floor(Math.random() * sounds.length)]
                playSound(sound, 0.65)
            }
        }

        setTimeout(async () => {
            try {
            const multiplayerAnswer = multiplayerRace
                ? {
                    raceId: multiplayerRace.raceId,
                    answerSequence: ++multiplayerAnswerSequenceRef.current,
                    enemyDefeated: localCorrect && currentEnemy.hp <= 1
                }
                : undefined
            const response = await answerWord(
                session.id,
                answer,
                currentDirection,
                submittedTimeLeft,
                selectedModifiers,
                responseTimeSeconds,
                rushHourElapsedSeconds,
                multiplayerAnswer
            )
            const wasCorrect = response.correct
            const nextStreak = wasCorrect ? streak + 1 : 0
            const rushTimedOut = isRushActive && timedOut
            const wasBossEncounter = isBossEncounter
            const bossEncounterDefeated = wasBossEncounter && wasCorrect && currentEnemy.hp <= 1
            const hasMomentum = selectedModifiers.includes("momentum")

            let nextSession = response.session
            let nextTimeLeft = timerDuration

            shouldResetTimerRef.current = !isRushActive && (!wasBossEncounter || bossEncounterDefeated)
            if (shouldResetTimerRef.current) {
                timeLeftRef.current = timerDuration
            }

            if (isRushActive) {
                nextTimeLeft = wasCorrect
                    ? Math.min(timerDuration, submittedTimeLeft + RUSH_REFILL_SECONDS)
                    : submittedTimeLeft

                timeLeftRef.current = nextTimeLeft
            }

            if (hasMomentum && !isRushActive && !wasBossEncounter) {
                const momentumTimerCap = Math.min(timerDuration, MOMENTUM_TIMER_CAP)
                nextTimeLeft = wasCorrect
                    ? Math.min(momentumTimerCap, submittedTimeLeft + MOMENTUM_REFILL_SECONDS)
                    : Math.min(momentumTimerCap, MOMENTUM_RECOVERY_SECONDS_AFTER_LIFE_LOSS)

                shouldResetTimerRef.current = false
                timeLeftRef.current = nextTimeLeft
            }

            if (isRushActive && wasCorrect) {
                const rushScore = response.session.finalScore - rushScoreStartRef.current
                setRushAnswers(prev => prev + 1)

                if (!response.gameComplete && nextTimeLeft >= timerDuration) {
                    const bonusScore = Math.round(rushScore * (RUSH_BONUS_MULTIPLIER - 1))
                    const bonusSession = await completeRushHour(
                        response.session.id,
                        bonusScore,
                        rushHourElapsedSeconds,
                        multiplayerRace?.raceId
                    )
                    nextSession = { ...response.session, finalScore: bonusSession.finalScore }
                    setRushBonusFlash(true)
                    setTimeout(() => setRushBonusFlash(false), 1500)
                    endRushHour()
                    shouldResetTimerRef.current = true
                }
            } else if (rushTimedOut) {
                if (multiplayerRace) {
                    try {
                        await completeRushHour(
                            response.session.id,
                            0,
                            rushHourElapsedSeconds,
                            multiplayerRace.raceId,
                            false
                        )
                    } catch (error) {
                        console.error("Kunne ikke avslutte Rush Hour i Race", error)
                    }
                }
                endRushHour()
                shouldResetTimerRef.current = true
            }

            if (!isRushActive && wasCorrect) {
                const nextFastCorrectCount = answerTimeMs <= RUSH_FAST_ANSWER_MS
                    ? fastCorrectCount + 1
                    : 0

                if (nextFastCorrectCount >= RUSH_TRIGGER_COUNT) {
                    const started = await startRushHour(
                        response.session.id,
                        response.session.finalScore,
                        multiplayerRace?.raceId
                    )

                    if (started) {
                        shouldResetTimerRef.current = false
                        timeLeftRef.current = Math.min(timerDuration, RUSH_START_SECONDS)
                    }
                    setFastCorrectCount(0)
                } else {
                    setFastCorrectCount(nextFastCorrectCount)
                }
            } else if (!isRushActive && !wasCorrect) {
                setFastCorrectCount(0)
            }

            const nextScoreDelta = nextSession.finalScore - session.finalScore
            setScoreDelta(nextScoreDelta > 0 ? nextScoreDelta : null)
            if (nextScoreDelta > 0) window.setTimeout(() => setScoreDelta(null), 950)

            setSession(nextSession)
            setResult(null)
            setStats(prev => ({
                totalAnswers: prev.totalAnswers + 1,
                correctAnswers: prev.correctAnswers + (wasCorrect ? 1 : 0),
                bestStreak: Math.max(prev.bestStreak, nextStreak)
            }))

            if (wasCorrect) onCorrectAnswer()
            else onWrongAnswer()

            if (wasCorrect && currentEnemy.hp <= 1) {
                showDefeatedEnemy(currentEnemy)
            } else if (!wasCorrect) {
                setVisualEnemyOverride(null)
            }

            showAchievements(response.newlyUnlockedAchievements)

            if (response.gameOver) {
                await handleGameOver(response.session)
                return
            }

            if (response.gameComplete) {
                await handleRunComplete(nextSession)
                return
            }

            setTimeout(() => inputRef.current?.focus(), 50)
            } catch (error) {
                console.error("Could not submit answer", error)
                setResult(null)
                if (!multiplayerRace?.isFinished) {
                    setTimeout(() => inputRef.current?.focus(), 50)
                }
            }
        }, isRushActive ? 120 : 800)
    }

    const restartGame = async () => {
        const newSession = await startGame(Number(id), selectedModifiers, selectedRoundLimit)
        resetZoneRun()
        endRushHour()
        setSession(newSession)
        setResult(null)
        setGameOver(false)
        setRunComplete(false)
        resetEndTransition()
        setIsNewHighScore(false)
        setScoreDelta(null)
        countdownSoundStartedRef.current = false
        setStartCountdown(3)
        setStats({ totalAnswers: 0, correctAnswers: 0, bestStreak: 0 })
        setFastCorrectCount(0)
        setCurrentDirection(resolveDirection(selectedDirection))
        setVisualEnemyOverride(null)
        clearVisualEnemyTimer()
        shouldResetTimerRef.current = true
        timeLeftRef.current = timerDuration
        const gameOverMusic = gameOverMusicRef.current
        if (gameOverMusic) {
            gameOverMusic.pause()
            gameOverMusic.currentTime = 0
        }
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    const activateRushHour = (scoreStart: number) => {
        rushActiveRef.current = true
        rushScoreStartRef.current = scoreStart
        rushStartedAtRef.current = Date.now()
        setRushAnswers(0)
        setRushActive(true)
    }

    const startRushHour = async (sessionId: number, scoreStart: number, multiplayerRaceId?: string) => {
        if (multiplayerRaceId) {
            try {
                await recordRushHourStart(sessionId, multiplayerRaceId)
                activateRushHour(scoreStart)
                return true
            } catch (error) {
                console.error("Kunne ikke starte Rush Hour i Race", error)
                return false
            }
        }

        activateRushHour(scoreStart)
        void recordRushHourStart(sessionId).catch(error => {
            console.error("Kunne ikke lagre Rush Hour-start", error)
        })
        return true
    }

    const endRushHour = () => {
        rushActiveRef.current = false
        rushScoreStartRef.current = 0
        rushStartedAtRef.current = null
        setRushActive(false)
        setRushAnswers(0)
    }

    const handleSetupSelect = (direction: GameDirection, modifiers: ActiveGameModifier[], roundLimit: RoundLimit) => {
        const params = new URLSearchParams({ direction })

        if (modifiers.length > 0) {
            params.set("mods", modifiers.join(","))
        }

        params.set("roundLimit", roundLimit === null ? "endless" : String(roundLimit))
        setSetupModalOpen(false)
        navigate(`/decks/${id}/play?${params.toString()}`)
    }

    if (!session || !stageAssetsReady) return <PlayLoadingScreen backgroundImageUrl={currentZone.backgroundUrl} />

    const displayEnemy = visualEnemyOverride ?? currentEnemy
    const enemyVisualState = visualEnemyOverride ? "death" : result === "correct" ? "hurt" : "idle"
    const hpPercent = (displayEnemy.hp / displayEnemy.maxHp) * 100
    const accuracy = stats.totalAnswers === 0 ? 0 : Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
    const promptWord = currentDirection === "original" ? session.currentWord.original : session.currentWord.translation
    const revealedAnswer = currentDirection === "original" ? session.currentWord.translation : session.currentWord.original
    const momentumStacks = selectedModifiers.includes("momentum") ? getMomentumStacks(session.streakCount) : 0
    const noTimeActive = selectedModifiers.includes("noTime")
    const timerTickMs = rushActive ? RUSH_TICK_MS : getMomentumTimerTickMs(momentumStacks)
    const activeModifierLabel = [
        selectedModifiers.includes("momentum") ? "Momentum" : null,
        noTimeActive ? "No Time" : null
    ].filter(Boolean).join(" / ")
    const stageLabel = isBossEncounter
        ? `${currentZone.name} - Final Boss`
        : `${currentZone.name} - ${currentEncounterIndex} / ${currentZone.encountersBeforeBoss}`

    if (!multiplayerRace && (gameOver || runComplete) && endTransitionPhase === "results") return (
        <>
            {deck && (
                <GameModeModal
                    isOpen={setupModalOpen}
                    deck={deck}
                    onSelect={handleSetupSelect}
                    onClose={() => setSetupModalOpen(false)}
                />
            )}
            <RunResultScreen
                outcome={runComplete ? "complete" : "gameOver"}
                deck={deck}
                direction={selectedDirection}
                modifiers={selectedModifiers}
                roundLimit={session.roundLimit}
                backgroundImageUrl={currentZone.backgroundUrl}
                finalScore={session.finalScore}
                highScore={highScore}
                isNewHighScore={isNewHighScore}
                correctAnswers={stats.correctAnswers}
                wrongAnswers={session.wrongAnswers}
                totalAnswers={stats.totalAnswers}
                bestCombo={stats.bestStreak}
                enemiesDefeated={enemiesKilled}
                onPlayAgain={restartGame}
                onChangeSetup={() => setSetupModalOpen(true)}
                onReturnToDecks={() => navigate("/decks")}
            />
        </>
    )

    return (
        <div className="relative h-screen h-dvh min-h-0 overflow-hidden bg-[#101017] text-white">
            <img
                src={currentZone.backgroundUrl}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div
                className={`pointer-events-none absolute inset-0 ${rushActive
                    ? "bg-[linear-gradient(rgba(24,20,10,0.48),rgba(24,20,10,0.7))]"
                    : "bg-[linear-gradient(rgba(0,0,0,0.18),rgba(0,0,0,0.5))]"
                }`}
            />
            {startCountdown !== null && (
                <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-black/25 text-white backdrop-blur-[2px]">
                    <div className="text-center">
                        <p className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Get ready</p>
                        <p className="mt-3 text-7xl font-black drop-shadow-[0_0_34px_rgba(255,255,255,0.22)] sm:text-9xl">
                            {startCountdown}
                        </p>
                    </div>
                </div>
            )}
            <div className="relative z-10 flex h-full min-h-0 w-full flex-col px-3 py-3 sm:px-6 sm:py-6">
                <GameHud
                    lives={session.lives}
                    maxLives={maxLives}
                    showLives={!multiplayerRace}
                    stageLabel={stageLabel}
                    score={session.finalScore}
                    scoreDelta={scoreDelta}
                    modifierLabel={activeModifierLabel}
                    accuracy={accuracy}
                    streak={streak}
                    rushActive={rushActive}
                />

                <RushHourNotice
                    active={rushActive}
                    bonusFlash={rushBonusFlash}
                    answers={rushAnswers}
                />

                <main className="relative flex w-full flex-1 flex-col items-center justify-center text-center">
                    <EnemyStage
                        enemy={displayEnemy}
                        result={result}
                        hpPercent={hpPercent}
                        enemyVisualState={enemyVisualState}
                    />

                    <AnswerPanel
                        promptWord={promptWord}
                        revealedAnswer={revealedAnswer}
                        result={result}
                        resetKey={`${session.currentWordId}-${session.questionsAnswered}`}
                        hiddenModifierActive={selectedModifiers.includes("hidden")}
                        inputRef={inputRef}
                        timerDuration={timerDuration}
                        timerInitialTimeLeft={timeLeftRef.current}
                        timerResetKey={`${session.currentWordId}-${session.questionsAnswered}-${timerDuration}-${rushActive}`}
                        timerHidden={noTimeActive}
                        timerTickMs={timerTickMs}
                        timerRunning={!result && !gameOver && !runComplete && !multiplayerRace?.isFinished && startCountdown === null}
                        rushActive={rushActive}
                        onTimerTick={timeLeft => {
                            timeLeftRef.current = timeLeft
                        }}
                        onTimeout={() => handleSubmit("", true)}
                        onSubmitAnswer={answer => handleSubmit(answer)}
                    />
                </main>
            </div>
            {multiplayerRace?.overlay}
            {(gameOver || multiplayerRace?.isFinished) && (
                <div
                    className="pointer-events-none fixed inset-x-0 top-20 z-[65] flex justify-center px-4"
                    role="status"
                    aria-live="polite"
                >
                    <p className="rounded-full border border-white/15 bg-black/65 px-5 py-2 text-sm font-black text-white shadow-2xl backdrop-blur-sm">
                        {multiplayerRace?.isFinished
                            ? multiplayerRace.isDnf
                                ? "DNF - waiting for the other players..."
                                : `You finished${multiplayerRace.winnerName ? ` - ${multiplayerRace.winnerName} is currently leading` : ""}. Waiting for the other players...`
                            : "You are out - the Race continues"}
                    </p>
                </div>
            )}
            {endTransitionPhase === "end-flash" && runEndOutcome && (
                <motion.div
                    className="pointer-events-none fixed inset-0 z-[70] grid place-items-center bg-black/45 text-white backdrop-blur-[2px]"
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                    animate={prefersReducedMotion
                        ? { opacity: 1 }
                        : {
                            opacity: [0, 1, 1, 0],
                            scale: [0.99, 1, 1, 0.995]
                        }}
                    transition={prefersReducedMotion
                        ? { duration: 0.1 }
                        : {
                            duration: END_TRANSITION_DURATION_MS / 1000,
                            ease: "easeOut",
                            times: [0, 0.22, 0.76, 1]
                        }}
                >
                    <p className="px-4 text-center text-3xl font-black tracking-wide drop-shadow-[0_0_26px_rgba(255,255,255,0.22)] sm:text-5xl md:text-6xl">
                        {runEndOutcome === "complete" ? "Run Complete" : "Run Failed"}
                    </p>
                </motion.div>
            )}
        </div>
    )
}
