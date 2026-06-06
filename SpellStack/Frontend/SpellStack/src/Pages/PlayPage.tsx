import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"

import { completeRushHour, endGame, answerWord, startGame, type ActiveGameModifier, type GameDirection, type GameSession, type ResolvedDirection, type RoundLimit } from "../api/gameSession"
import FadeIn from "../components/FadeIn"
import AnswerPanel from "../components/game/AnswerPanel"
import EnemyStage from "../components/game/EnemyStage"
import GameHud from "../components/game/GameHud"
import PlayLoadingScreen from "../components/game/PlayLoadingScreen"
import RunResultScreen from "../components/game/RunResultScreen"
import RushHourNotice from "../components/game/RushHourNotice"
import { useZoneRun } from "../hooks/useZoneRun"
import { cacheGameImages } from "../utils/gameImageCache"
import { isAnswerAccepted, splitAcceptedAnswers } from "../utils/answerUtils"
import correctSoundUrl from "../assets/SFX/correct_sound.mp3"
import correctSoundTwoUrl from "../assets/SFX/correct_2.mp3"
import gameStartCountdownUrl from "../assets/SFX/game_start_countdown.mp3"
import gameOverMusicUrl from "../assets/SFX/game_over_music.mp3"
import incorrectSoundOneUrl from "../assets/SFX/incorrect_1.mp3"
import incorrectSoundTwoUrl from "../assets/SFX/incorrect_2.mp3"

const TIMER_DURATION = 10
const BOSS_TIMER_DURATION = 20
const MOMENTUM_TIMER_DURATION = 15
const MOMENTUM_REFILL_SECONDS = 4
const RUSH_TRIGGER_COUNT = 10
const RUSH_FAST_ANSWER_MS = 3000
const RUSH_START_SECONDS = 4
const RUSH_REFILL_SECONDS = 4
const RUSH_TICK_MS = 500
const RUSH_BONUS_MULTIPLIER = 2.5


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
        modifier === "zen" || modifier === "extraHeart" || modifier === "hardcore" || modifier === "momentum" || modifier === "hidden"
    )

    return Array.from(new Set(parsedMods))
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
    if (modifiers.includes("momentum")) return MOMENTUM_TIMER_DURATION
    if (modifiers.includes("zen")) return 15
    return TIMER_DURATION
}

function getMaxLives(modifiers: ActiveGameModifier[]) {
    if (modifiers.includes("hardcore")) return 1

    let lives = 3
    if (modifiers.includes("zen")) lives = 4
    if (modifiers.includes("extraHeart")) lives += 1
    return lives
}


function getRank(stats: RunStats, score: number) {
    const accuracy = stats.totalAnswers === 0 ? 0 : stats.correctAnswers / stats.totalAnswers

    if (accuracy >= 0.95 && stats.bestStreak >= 10) return { rank: "S", label: "Legendary run", color: "text-yellow-400" }
    if (accuracy >= 0.85 && score >= 1000) return { rank: "A", label: "Sharp spellwork", color: "text-green-400" }
    if (accuracy >= 0.7) return { rank: "B", label: "Solid control", color: "text-sky-400" }
    if (accuracy >= 0.5) return { rank: "C", label: "Getting warmer", color: "text-orange-400" }
    return { rank: "D", label: "Needs practice", color: "text-red-400" }
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


export default function PlayPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const selectedDirection = (searchParams.get("direction") ?? "original") as GameDirection
    const selectedModifiers = resolveModifiers(searchParams.get("mods"), searchParams.get("modifier"))
    const selectedModifierKey = selectedModifiers.join(",")
    const selectedRoundLimit = resolveRoundLimit(searchParams.get("roundLimit"))
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

    const inputRef = useRef<HTMLInputElement>(null)
    const shouldResetTimerRef = useRef(true)
    const timeLeftRef = useRef(timerDuration)
    const wordStartedAtRef = useRef(Date.now())
    const rushActiveRef = useRef(false)
    const rushScoreStartRef = useRef(0)
    const correctSoundRefs = useRef<HTMLAudioElement[] | null>(null)
    const incorrectSoundRefs = useRef<HTMLAudioElement[] | null>(null)
    const countdownSoundRef = useRef<HTMLAudioElement | null>(null)
    const countdownSoundStartedRef = useRef(false)
    const gameOverMusicRef = useRef<HTMLAudioElement | null>(null)

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
        startGame(Number(id), selectedModifiers, selectedRoundLimit).then(s => {
            setSession(s)
            setHighScore(s.finalScore)
            setScoreDelta(null)
            countdownSoundStartedRef.current = false
            setStartCountdown(3)
            setCurrentDirection(resolveDirection(selectedDirection))
        })
    }, [id, selectedDirection, selectedModifierKey, selectedRoundLimitKey])


    useEffect(() => {
        if (!session || !stageAssetsReady || gameOver || runComplete || startCountdown === null) return
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
    }, [session?.id, stageAssetsReady, gameOver, runComplete])
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
        } catch (error) {
            console.error("Kunne ikke oppdatere high score", error)
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
        } catch (error) {
            console.error("Kunne ikke oppdatere high score", error)
        }
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
        if (result || gameOver || runComplete || !session) return
        const isRushActive = rushActiveRef.current
        const submittedTimeLeft = timedOut ? 0 : timeLeftRef.current
        const answer = timedOut ? "" : submittedAnswer
        const localCorrect = !timedOut && isLocallyCorrect(answer)
        const answerTimeMs = Date.now() - wordStartedAtRef.current

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
            const response = await answerWord(session.id, answer, currentDirection, submittedTimeLeft, selectedModifiers, isRushActive)
            const wasCorrect = response.correct
            const nextStreak = wasCorrect ? streak + 1 : 0
            const hasMomentum = selectedModifiers.includes("momentum")
            const rushTimedOut = isRushActive && timedOut
            const wasBossEncounter = isBossEncounter
            const bossEncounterDefeated = wasBossEncounter && wasCorrect && currentEnemy.hp <= 1

            let nextSession = response.session
            let nextTimeLeft = timerDuration

            shouldResetTimerRef.current = !hasMomentum && !isRushActive && (!wasBossEncounter || bossEncounterDefeated)
            if (shouldResetTimerRef.current) {
                timeLeftRef.current = timerDuration
            }

            if (isRushActive) {
                nextTimeLeft = wasCorrect
                    ? Math.min(timerDuration, submittedTimeLeft + RUSH_REFILL_SECONDS)
                    : submittedTimeLeft

                timeLeftRef.current = nextTimeLeft
            } else if (hasMomentum && !wasBossEncounter) {
                timeLeftRef.current = wasCorrect
                    ? Math.min(timerDuration, submittedTimeLeft + MOMENTUM_REFILL_SECONDS)
                    : submittedTimeLeft
            }

            if (isRushActive && wasCorrect) {
                const rushScore = response.session.finalScore - rushScoreStartRef.current
                setRushAnswers(prev => prev + 1)

                if (!response.gameComplete && nextTimeLeft >= timerDuration) {
                    const bonusScore = Math.round(rushScore * (RUSH_BONUS_MULTIPLIER - 1))
                    const bonusSession = await completeRushHour(response.session.id, bonusScore)
                    nextSession = { ...response.session, finalScore: bonusSession.finalScore }
                    setRushBonusFlash(true)
                    setTimeout(() => setRushBonusFlash(false), 1500)
                    endRushHour()
                    shouldResetTimerRef.current = true
                }
            } else if (rushTimedOut) {
                endRushHour()
                shouldResetTimerRef.current = true
            }

            if (!isRushActive && wasCorrect) {
                const nextFastCorrectCount = answerTimeMs <= RUSH_FAST_ANSWER_MS
                    ? fastCorrectCount + 1
                    : 0

                if (nextFastCorrectCount >= RUSH_TRIGGER_COUNT) {
                    startRushHour(response.session.finalScore)
                    shouldResetTimerRef.current = false
                    timeLeftRef.current = Math.min(timerDuration, RUSH_START_SECONDS)
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

            if (response.gameOver) {
                await handleGameOver(response.session)
                return
            }

            if (response.gameComplete) {
                await handleRunComplete(nextSession)
                return
            }

            setTimeout(() => inputRef.current?.focus(), 50)
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
        setIsNewHighScore(false)
        setScoreDelta(null)
        countdownSoundStartedRef.current = false
        setStartCountdown(3)
        setStats({ totalAnswers: 0, correctAnswers: 0, bestStreak: 0 })
        setFastCorrectCount(0)
        setCurrentDirection(resolveDirection(selectedDirection))
        shouldResetTimerRef.current = true
        timeLeftRef.current = timerDuration
        const gameOverMusic = gameOverMusicRef.current
        if (gameOverMusic) {
            gameOverMusic.pause()
            gameOverMusic.currentTime = 0
        }
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    const startRushHour = (scoreStart: number) => {
        rushActiveRef.current = true
        rushScoreStartRef.current = scoreStart
        setRushAnswers(0)
        setRushActive(true)
    }

    const endRushHour = () => {
        rushActiveRef.current = false
        rushScoreStartRef.current = 0
        setRushActive(false)
        setRushAnswers(0)
    }

    if (!session || !stageAssetsReady) return <PlayLoadingScreen backgroundImageUrl={currentZone.backgroundUrl} />

    const hpPercent = (currentEnemy.hp / currentEnemy.maxHp) * 100
    const accuracy = stats.totalAnswers === 0 ? 0 : Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
    const rank = getRank(stats, session.finalScore)
    const promptWord = currentDirection === "original" ? session.currentWord.original : session.currentWord.translation
    const revealedAnswer = currentDirection === "original" ? session.currentWord.translation : session.currentWord.original
    const stageLabel = isBossEncounter
        ? `${currentZone.name} - Final Boss`
        : `${currentZone.name} - ${currentEncounterIndex} / ${currentZone.encountersBeforeBoss}`

    if (gameOver || runComplete) return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-6">
            <FadeIn>
                <RunResultScreen
                    outcome={runComplete ? "complete" : "gameOver"}
                    modeLabel={runComplete
                        ? selectedModifiers.includes("zen") ? "Practice complete" : "Run complete"
                        : selectedModifiers.includes("zen") ? "Practice ended" : "Run ended"}
                    rank={rank}
                    title={runComplete ? "Deck cleared" : rank.label}
                    subtitle={runComplete
                        ? session.roundLimit ? `${session.questionsAnswered} / ${session.roundLimit} questions answered` : "Run complete"
                        : undefined}
                    stats={[
                        { label: "Score", value: session.finalScore },
                        { label: "Accuracy", value: `${accuracy}%` },
                        { label: "Best combo", value: `x${stats.bestStreak}` },
                        { label: "Defeated", value: enemiesKilled }
                    ]}
                    highlight={{
                        label: "High score",
                        value: highScore,
                        badge: isNewHighScore ? "New high score" : undefined
                    }}
                    onPrimaryAction={restartGame}
                    onSecondaryAction={() => navigate("/")}
                />
            </FadeIn>
        </div>
    )

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#222222] px-6 py-6 text-white">
            <img
                src={currentZone.backgroundUrl}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div
                className={`pointer-events-none absolute inset-0 ${rushActive
                    ? "bg-[linear-gradient(rgba(24,20,10,0.68),rgba(24,20,10,0.82))]"
                    : "bg-[linear-gradient(rgba(0,0,0,0.48),rgba(0,0,0,0.68))]"
                }`}
            />
            {startCountdown !== null && (
                <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-black/25 text-white backdrop-blur-[2px]">
                    <div className="text-center">
                        <p className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Get ready</p>
                        <p className="mt-3 text-9xl font-black drop-shadow-[0_0_34px_rgba(255,255,255,0.22)]">
                            {startCountdown}
                        </p>
                    </div>
                </div>
            )}
            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
                <GameHud
                    lives={session.lives}
                    maxLives={maxLives}
                    stageLabel={stageLabel}
                    score={session.finalScore}
                    scoreDelta={scoreDelta}
                    accuracy={accuracy}
                    streak={streak}
                    rushActive={rushActive}
                />

                <RushHourNotice
                    active={rushActive}
                    bonusFlash={rushBonusFlash}
                    answers={rushAnswers}
                />

                <main className="flex w-full flex-1 flex-col items-center justify-center gap-7 pb-20 pt-0 text-center">
                    <EnemyStage
                        enemy={currentEnemy}
                        result={result}
                        hpPercent={hpPercent}
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
                        timerTickMs={rushActiveRef.current ? RUSH_TICK_MS : 1000}
                        timerRunning={!result && !gameOver && !runComplete && startCountdown === null}
                        rushActive={rushActive}
                        onTimerTick={timeLeft => {
                            timeLeftRef.current = timeLeft
                        }}
                        onTimeout={() => handleSubmit("", true)}
                        onSubmitAnswer={answer => handleSubmit(answer)}
                    />
                </main>
            </div>
        </div>
    )
}
