import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"

import { completeRushHour, endGame, answerWord, startGame, type ActiveGameModifier, type GameDirection, type GameSession, type ResolvedDirection } from "../api/gameSession"
import FadeIn from "../components/FadeIn"
import LivesDisplay from "../components/LivesDisplay"
import { useEnemy } from "../hooks/useEnemy"
import correctSoundUrl from "../assets/SFX/correct_sound.mp3"
import correctSoundTwoUrl from "../assets/SFX/correct_2.mp3"
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

function normalize(value: string) {
    return value.trim().toLowerCase()
}

function resolveDirection(direction: GameDirection): ResolvedDirection {
    if (direction === "mixed") return Math.random() > 0.5 ? "original" : "translation"
    return direction
}

function resolveModifiers(mods: string | null, legacyModifier: string | null): ActiveGameModifier[] {
    const rawMods = mods ? mods.split(",") : legacyModifier ? [legacyModifier] : []
    const parsedMods = rawMods.filter((modifier): modifier is ActiveGameModifier =>
        modifier === "zen" || modifier === "extraHeart" || modifier === "hardcore" || modifier === "momentum"
    )

    return Array.from(new Set(parsedMods))
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

function getModifierLabel(modifiers: ActiveGameModifier[]) {
    if (modifiers.length === 0) return "Normal"
    return modifiers.map(modifier => {
        if (modifier === "zen") return "Zen"
        if (modifier === "extraHeart") return "Extra heart"
        if (modifier === "momentum") return "Momentum"
        return "Hardcore"
    }).join(", ")
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

export default function PlayPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const selectedDirection = (searchParams.get("direction") ?? "original") as GameDirection
    const selectedModifiers = resolveModifiers(searchParams.get("mods"), searchParams.get("modifier"))
    const selectedModifierKey = selectedModifiers.join(",")
    const { currentEnemy, streak, enemiesKilled, onCorrectAnswer, onWrongAnswer, resetEnemyRun } = useEnemy()
    const isBossEncounter = currentEnemy.type === "Boss" || currentEnemy.type === "MiniBoss"
    const timerDuration = getTimerDuration(selectedModifiers, isBossEncounter)
    const maxLives = getMaxLives(selectedModifiers)

    const [session, setSession] = useState<GameSession | null>(null)
    const [input, setInput] = useState("")
    const [result, setResult] = useState<"correct" | "incorrect" | null>(null)
    const [timeLeft, setTimeLeft] = useState(timerDuration)
    const [gameOver, setGameOver] = useState(false)
    const [highScore, setHighScore] = useState<number | null>(null)
    const [isNewHighScore, setIsNewHighScore] = useState(false)
    const [currentDirection, setCurrentDirection] = useState<ResolvedDirection>(() => resolveDirection(selectedDirection))
    const [stats, setStats] = useState<RunStats>({ totalAnswers: 0, correctAnswers: 0, bestStreak: 0 })
    const [fastCorrectCount, setFastCorrectCount] = useState(0)
    const [rushActive, setRushActive] = useState(false)
    const [rushAnswers, setRushAnswers] = useState(0)
    const [rushBonusFlash, setRushBonusFlash] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const shouldResetTimerRef = useRef(true)
    const wordStartedAtRef = useRef(Date.now())
    const rushActiveRef = useRef(false)
    const rushScoreStartRef = useRef(0)
    const correctSoundRefs = useRef([
        new Audio(correctSoundUrl),
        new Audio(correctSoundTwoUrl)
    ])
    const incorrectSoundRefs = useRef([
        new Audio(incorrectSoundOneUrl),
        new Audio(incorrectSoundTwoUrl)
    ])
    const gameOverMusicRef = useRef(new Audio(gameOverMusicUrl))

    useEffect(() => {
        const gameOverMusic = gameOverMusicRef.current
        const correctSounds = correctSoundRefs.current
        const incorrectSounds = incorrectSoundRefs.current

        return () => {
            gameOverMusic.pause()
            correctSounds.forEach(sound => sound.pause())
            incorrectSounds.forEach(sound => sound.pause())
        }
    }, [])

    useEffect(() => {
        startGame(Number(id), selectedModifiers).then(s => {
            setSession(s)
            setHighScore(s.finalScore)
            setCurrentDirection(resolveDirection(selectedDirection))
        })
    }, [id, selectedDirection, selectedModifierKey])

    useEffect(() => {
        if (!session || gameOver) return
        setCurrentDirection(resolveDirection(selectedDirection))
        wordStartedAtRef.current = Date.now()
        startTimer(shouldResetTimerRef.current)
        shouldResetTimerRef.current = true
        return () => stopTimer()
    }, [session?.currentWordId, rushActive, currentEnemy.type])

    const startTimer = (resetTimer = true) => {
        stopTimer()
        if (resetTimer) setTimeLeft(timerDuration)
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    stopTimer()
                    handleSubmit(true)
                    return 0
                }
                return prev - 1
            })
        }, rushActiveRef.current ? RUSH_TICK_MS : 1000)
    }

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current)
    }

    const handleGameOver = async (finishedSession: GameSession) => {
        stopTimer()
        setGameOver(true)
        playSound(gameOverMusicRef.current, 0.75)
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
            return normalize(answer) === normalize(session.currentWord.original)
        }

        const acceptedAnswers = [
            session.currentWord.translation,
            ...(session.currentWord.alternativeTranslation?.split(",") ?? [])
        ]

        return acceptedAnswers.some(acceptedAnswer => normalize(answer) === normalize(acceptedAnswer))
    }

    const handleSubmit = async (timedOut = false) => {
        if (result || gameOver || !session) return
        const isRushActive = rushActiveRef.current
        const submittedTimeLeft = timedOut ? 0 : timeLeft
        const answer = timedOut ? "" : input
        const localCorrect = !timedOut && isLocallyCorrect(answer)
        const answerTimeMs = Date.now() - wordStartedAtRef.current

        stopTimer()
        setResult(localCorrect ? "correct" : "incorrect")
        if (localCorrect) {
            const sounds = correctSoundRefs.current
            const sound = sounds[Math.floor(Math.random() * sounds.length)]
            playSound(sound, rushActiveRef.current ? 0.9 : 0.7)
        } else {
            const sounds = incorrectSoundRefs.current
            const sound = sounds[Math.floor(Math.random() * sounds.length)]
            playSound(sound, 0.65)
        }

        setTimeout(async () => {
            const response = await answerWord(session.id, answer, currentDirection, submittedTimeLeft, selectedModifiers, isRushActive)
            const wasCorrect = response.correct
            const nextStreak = wasCorrect ? streak + 1 : 0
            const hasMomentum = selectedModifiers.includes("momentum")
            const rushTimedOut = isRushActive && timedOut
            const wasBossEncounter = currentEnemy.type === "Boss" || currentEnemy.type === "MiniBoss"
            const bossEncounterDefeated = wasBossEncounter && wasCorrect && currentEnemy.hp <= 1

            let nextSession = response.session
            let nextTimeLeft = timerDuration

            shouldResetTimerRef.current = !hasMomentum && !isRushActive && (!wasBossEncounter || bossEncounterDefeated)
            if (isRushActive) {
                nextTimeLeft = wasCorrect
                    ? Math.min(timerDuration, submittedTimeLeft + RUSH_REFILL_SECONDS)
                    : submittedTimeLeft

                setTimeLeft(nextTimeLeft)
            } else if (hasMomentum && !wasBossEncounter) {
                setTimeLeft(wasCorrect
                    ? Math.min(timerDuration, submittedTimeLeft + MOMENTUM_REFILL_SECONDS)
                    : submittedTimeLeft
                )
            }

            if (isRushActive && wasCorrect) {
                const rushScore = response.session.finalScore - rushScoreStartRef.current
                setRushAnswers(prev => prev + 1)

                if (nextTimeLeft >= timerDuration) {
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
                    setTimeLeft(Math.min(timerDuration, RUSH_START_SECONDS))
                    setFastCorrectCount(0)
                } else {
                    setFastCorrectCount(nextFastCorrectCount)
                }
            } else if (!isRushActive && !wasCorrect) {
                setFastCorrectCount(0)
            }

            setSession(nextSession)
            setResult(null)
            setInput("")
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

            setTimeout(() => inputRef.current?.focus(), 50)
        }, isRushActive ? 120 : 800)
    }

    const restartGame = async () => {
        const newSession = await startGame(Number(id), selectedModifiers)
        resetEnemyRun()
        endRushHour()
        setSession(newSession)
        setResult(null)
        setInput("")
        setGameOver(false)
        setIsNewHighScore(false)
        setStats({ totalAnswers: 0, correctAnswers: 0, bestStreak: 0 })
        setFastCorrectCount(0)
        setCurrentDirection(resolveDirection(selectedDirection))
        shouldResetTimerRef.current = true
        setTimeLeft(timerDuration)
        gameOverMusicRef.current.pause()
        gameOverMusicRef.current.currentTime = 0
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

    if (!session) return <p className="text-center mt-20 text-gray-400">Loading...</p>

    const timerPercent = (timeLeft / timerDuration) * 100
    const hpPercent = (currentEnemy.hp / currentEnemy.maxHp) * 100
    const accuracy = stats.totalAnswers === 0 ? 0 : Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
    const rank = getRank(stats, session.finalScore)
    const promptWord = currentDirection === "original" ? session.currentWord.original : session.currentWord.translation
    const revealedAnswer = currentDirection === "original" ? session.currentWord.translation : session.currentWord.original
    const directionLabel = currentDirection === "original" ? "Translate" : "Reverse"

    if (gameOver) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 px-6">
            <FadeIn>
                <GameOverScreen
                    modeLabel={selectedModifiers.includes("zen") ? "Practice complete" : "Run complete"}
                    rank={rank}
                    score={session.finalScore}
                    accuracy={accuracy}
                    bestStreak={stats.bestStreak}
                    enemiesKilled={enemiesKilled}
                    highScore={highScore}
                    isNewHighScore={isNewHighScore}
                    onRestart={restartGame}
                    onExit={() => navigate("/")}
                />
            </FadeIn>
        </div>
    )

    return (
        <div className={`relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-6 ${
            rushActive ? "bg-yellow-50" : "bg-gray-50"
        }`}>
            {rushActive && (
                <>
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.34),transparent_58%)]" />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_42%,rgba(250,204,21,0.18)_43%,transparent_49%,transparent_100%)]" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-yellow-300 shadow-[0_0_34px_rgba(250,204,21,0.95)]" />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-300/30 shadow-[0_0_80px_rgba(250,204,21,0.35)]" />
                    <div className="pointer-events-none absolute -left-16 top-1/4 h-64 w-24 rotate-12 bg-yellow-300/40 blur-xl" />
                    <div className="pointer-events-none absolute -right-16 bottom-1/4 h-64 w-24 rotate-12 bg-amber-300/40 blur-xl" />
                </>
            )}
            {rushBonusFlash && (
                <div className="pointer-events-none absolute inset-x-0 top-24 z-20 text-center">
                    <p className="inline-flex rounded-full bg-orange-400 px-6 py-3 text-sm font-black uppercase tracking-[0.25em] text-white shadow-2xl">
                        Rush cleared x2.5
                    </p>
                </div>
            )}
            <div className="absolute top-8 right-8 text-right">
                <p className="text-gray-400 text-sm font-medium">
                    {selectedModifiers.includes("zen") ? "Practice" : "Score"}
                </p>
                <p className="text-2xl font-bold text-gray-800">{session.finalScore}</p>
                <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
                    {getModifierLabel(selectedModifiers)}
                </p>
            </div>

            <div className="absolute top-8 left-8">
                <button
                    onClick={() => navigate("/decks")}
                    className="text-gray-400 hover:text-gray-600 text-sm transition"
                >
                    Exit
                </button>
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8">
                <LivesDisplay lives={session.lives} maxLives={maxLives} />

                {rushActive && (
                    <div className="w-full rounded-lg border-2 border-yellow-300 bg-yellow-100 px-5 py-4 text-center shadow-[0_0_28px_rgba(250,204,21,0.45)]">
                        <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-600">Rush Hour</p>
                        <p className="mt-1 text-sm font-semibold text-gray-500">
                            Fill the timer for x2.5 on this rush
                        </p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                            Rush hits: {rushAnswers}
                        </p>
                    </div>
                )}

                <div className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400">Combo</p>
                        <p className="text-xl font-bold text-orange-400">x{streak}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-gray-400">
                            {rushActive ? "Fast chain" : "Accuracy"}
                        </p>
                        <p className="text-xl font-bold text-gray-700">
                            {rushActive ? "LIVE" : `${accuracy}%`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <p className="text-gray-400 text-xs uppercase tracking-widest">
                        {currentEnemy.type}
                    </p>
                    <p className="text-2xl font-bold text-gray-700">{currentEnemy.enemyName}</p>
                    <img
                        key={currentEnemy.id}
                        src={currentEnemy.imageUrl}
                        alt={currentEnemy.enemyName}
                        className={`max-h-52 object-contain transition duration-300 ${
                            result === "correct" ? "scale-95 brightness-125" : ""
                        }`}
                    />
                    <div className="h-3 w-64 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${
                                currentEnemy.type === "Boss" ? "bg-red-400" :
                                currentEnemy.type === "MiniBoss" ? "bg-purple-400" : "bg-orange-400"
                            }`}
                            style={{ width: `${hpPercent}%` }}
                        />
                    </div>
                    <p className="text-gray-400 text-sm">
                        HP {currentEnemy.hp} / {currentEnemy.maxHp} - Defeated {enemiesKilled}
                    </p>
                </div>

                <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">
                    {directionLabel}
                </p>

                <div className="text-center">
                    <h1 className={`text-6xl font-bold transition-all duration-300 ${
                        result === "correct" ? "text-green-400" :
                        result === "incorrect" ? "text-red-400" : "text-gray-800"
                    }`}>
                        {promptWord}
                    </h1>
                    {result === "correct" && (
                        <p className="text-green-400 text-lg mt-3 font-semibold">
                            {selectedModifiers.includes("zen") ? "spell hit" : "+ spell hit"}
                        </p>
                    )}
                    {result === "incorrect" && (
                        <p className="text-gray-400 text-lg mt-3">
                            {revealedAnswer}
                        </p>
                    )}
                </div>

                <div className="w-full flex justify-center">
                    <div
                        className={`h-1 rounded-full transition-all ${
                            rushActive ? "bg-yellow-300" :
                            timeLeft <= 3 ? "bg-red-400" :
                            timeLeft <= 6 ? "bg-orange-400" : "bg-green-400"
                        }`}
                        style={{
                            width: `${timerPercent}%`,
                            transitionDuration: rushActive ? "250ms" : "1000ms",
                            boxShadow: rushActive ? "0 0 24px rgba(250, 204, 21, 0.95)" : undefined
                        }}
                    />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    disabled={!!result}
                    placeholder="Type translation..."
                    autoFocus
                    className="w-full text-center border-b-2 border-gray-200 focus:border-orange-400 outline-none py-3 text-xl bg-transparent transition placeholder:text-gray-300"
                />
            </div>
        </div>
    )
}

function GameOverScreen({
    modeLabel,
    rank,
    score,
    accuracy,
    bestStreak,
    enemiesKilled,
    highScore,
    isNewHighScore,
    onRestart,
    onExit
}: {
    modeLabel: string
    rank: { rank: string; label: string; color: string }
    score: number
    accuracy: number
    bestStreak: number
    enemiesKilled: number
    highScore: number | null
    isNewHighScore: boolean
    onRestart: () => void
    onExit: () => void
}) {
    return (
        <div className="flex flex-col items-center gap-6">
            <div className="text-center">
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-[0.25em]">
                    {modeLabel}
                </p>
                <h1 className={`text-8xl font-black ${rank.color}`}>{rank.rank}</h1>
                <p className="text-2xl font-bold text-gray-800">{rank.label}</p>
            </div>

            <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                <GameOverStat label="Score" value={score} />
                <GameOverStat label="Accuracy" value={`${accuracy}%`} />
                <GameOverStat label="Best combo" value={`x${bestStreak}`} />
                <GameOverStat label="Defeated" value={enemiesKilled} />
            </div>

            <div className="text-center space-y-2">
                <p className="text-gray-500 text-base">High score: {highScore}</p>
                {isNewHighScore && (
                    <p className="text-orange-400 text-sm font-semibold uppercase tracking-[0.25em]">
                        New high score
                    </p>
                )}
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onRestart}
                    className="bg-orange-400 hover:bg-orange-500 text-white px-8 py-3 rounded-full font-semibold transition"
                >
                    Play again
                </button>
                <button
                    onClick={onExit}
                    className="text-gray-400 hover:text-gray-600 px-8 py-3 rounded-full transition"
                >
                    Exit
                </button>
            </div>
        </div>
    )
}

function GameOverStat({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-lg bg-white p-4 text-center shadow-sm">
            <p className="text-xs uppercase tracking-widest text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    )
}
