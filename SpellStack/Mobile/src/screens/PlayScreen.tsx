import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, Image, ImageBackground, StyleSheet, Text, View } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import type { RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { answerWord, endGame, startGame, type ActiveGameModifier, type GameDirection, type GameSession, type ResolvedDirection, type RoundLimit } from "../api/gameSession"
import correctSoundUrl from "../assets/SFX/correct_sound.mp3"
import gameOverMusicUrl from "../assets/SFX/game_over_music.mp3"
import incorrectSoundUrl from "../assets/SFX/incorrect_1.mp3"
import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { Screen } from "../components/Screen"
import { StatPill } from "../components/StatPill"
import { TextField } from "../components/TextField"
import { useZoneRun } from "../hooks/useZoneRun"
import type { RootStackParamList } from "../navigation/types"
import { useTheme } from "../theme/ThemeContext"
import { playSound } from "../utils/audio"

const TIMER_DURATION = 10
const BOSS_TIMER_DURATION = 20
const MOMENTUM_TIMER_DURATION = 15

function resolveDirection(direction: GameDirection): ResolvedDirection {
    if (direction === "mixed") return Math.random() > 0.5 ? "original" : "translation"
    return direction
}

function getTimerDuration(modifiers: ActiveGameModifier[], isBossEncounter: boolean) {
    if (isBossEncounter) return BOSS_TIMER_DURATION
    if (modifiers.includes("hardcore")) return 6
    if (modifiers.includes("momentum")) return MOMENTUM_TIMER_DURATION
    if (modifiers.includes("zen")) return 15
    return TIMER_DURATION
}

function describePrompt(session: GameSession, direction: ResolvedDirection) {
    if (direction === "translation") {
        return {
            prompt: session.currentWord.translation,
            answerLabel: "Source word"
        }
    }

    return {
        prompt: session.currentWord.original,
        answerLabel: "Translation"
    }
}

type FinishState = {
    title: string
    message: string
} | null

export function PlayScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, "Play">>()
    const { palette } = useTheme()
    const {
        currentZone,
        currentEnemy,
        isBossEncounter,
        enemiesKilled,
        onCorrectAnswer,
        onWrongAnswer,
        resetZoneRun
    } = useZoneRun()

    const deckId = route.params.deckId
    const direction = route.params.direction ?? "original"
    const modifiers = useMemo(() => route.params.modifiers ?? [], [route.params.modifiers])
    const roundLimit = route.params.roundLimit === undefined ? 25 : route.params.roundLimit
    const timerDuration = getTimerDuration(modifiers, isBossEncounter)

    const [session, setSession] = useState<GameSession | null>(null)
    const [resolvedDirection, setResolvedDirection] = useState<ResolvedDirection>(() => resolveDirection(direction))
    const [answer, setAnswer] = useState("")
    const [timeLeft, setTimeLeft] = useState(timerDuration)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<string | null>(null)
    const [finishState, setFinishState] = useState<FinishState>(null)
    const submittingRef = useRef(false)

    const beginRun = useCallback(async () => {
        const startingTimerDuration = getTimerDuration(modifiers, false)

        setLoading(true)
        setError(null)
        setFinishState(null)
        setFeedback(null)
        setAnswer("")
        setTimeLeft(startingTimerDuration)
        resetZoneRun()

        try {
            const nextSession = await startGame(deckId, modifiers, roundLimit as RoundLimit)
            setSession(nextSession)
            setResolvedDirection(resolveDirection(direction))
        } catch (startError) {
            setError(startError instanceof Error ? startError.message : "Could not start game")
        } finally {
            setLoading(false)
        }
    }, [deckId, direction, modifiers, resetZoneRun, roundLimit])

    useEffect(() => {
        beginRun()
    }, [beginRun])

    useEffect(() => {
        if (!session?.isActive || finishState || loading) return

        setTimeLeft(timerDuration)
    }, [finishState, loading, session?.currentWordId, session?.isActive, timerDuration])

    const submitAnswer = useCallback(async (forcedAnswer?: string) => {
        if (!session || finishState || submittingRef.current) return

        submittingRef.current = true
        const submittedAnswer = forcedAnswer ?? answer

        try {
            const result = await answerWord(session.id, submittedAnswer, resolvedDirection, timeLeft, modifiers)

            if (result.correct) {
                setFeedback("Correct")
                onCorrectAnswer()
                playSound(correctSoundUrl, 0.75)
            } else {
                setFeedback("Missed")
                onWrongAnswer()
                playSound(incorrectSoundUrl, 0.75)
            }

            setSession(result.session)
            setAnswer("")

            if (result.gameOver || result.gameComplete) {
                setFinishState({
                    title: result.gameComplete ? "Run complete" : "Game over",
                    message: result.gameComplete ? "You cleared the selected round count." : "No lives left this run."
                })
                if (result.gameOver) playSound(gameOverMusicUrl, 0.45)
                return
            }

            setResolvedDirection(resolveDirection(direction))
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Could not submit answer")
        } finally {
            submittingRef.current = false
        }
    }, [answer, direction, finishState, modifiers, onCorrectAnswer, onWrongAnswer, resolvedDirection, session, timeLeft])

    useEffect(() => {
        if (!session?.isActive || finishState || loading || submittingRef.current) return

        const interval = setInterval(() => {
            setTimeLeft(current => {
                if (current <= 1) {
                    submitAnswer("")
                    return 0
                }

                return current - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [finishState, loading, session?.isActive, session?.currentWordId, submitAnswer])

    const finishRun = async () => {
        if (!session) {
            navigation.goBack()
            return
        }

        try {
            await endGame(session.id)
        } catch {
            // Leaving a run should remain possible if the backend already closed it.
        }

        navigation.goBack()
    }

    if (loading) {
        return (
            <Screen scroll={false}>
                <View style={styles.center}>
                    <ActivityIndicator color="#ffffff" size="large" />
                    <Text style={styles.loadingText}>Starting run</Text>
                </View>
            </Screen>
        )
    }

    if (error || !session) {
        return (
            <Screen title="Play">
                <Card>
                    <Text style={styles.error}>{error ?? "No active session"}</Text>
                    <Button title="Try again" onPress={beginRun} />
                    <Button title="Back to decks" variant="secondary" onPress={() => navigation.goBack()} />
                </Card>
            </Screen>
        )
    }

    const promptInfo = describePrompt(session, resolvedDirection)
    const progress = session.roundLimit ? `${session.questionsAnswered}/${session.roundLimit}` : `${session.questionsAnswered}`

    return (
        <ImageBackground source={currentZone.backgroundUrl} resizeMode="cover" style={styles.background}>
            <View style={styles.overlay}>
                <Screen scroll={false} transparent>
                    <View style={styles.gameLayout}>
                        <View style={styles.hud}>
                            <StatPill label="Score" value={session.finalScore} />
                            <StatPill label="Lives" value={session.lives} />
                            <StatPill label="Time" value={timeLeft} />
                        </View>

                        <Card style={styles.stageCard}>
                            <Text style={[styles.zone, { color: palette.accent }]}>{currentZone.name}</Text>
                            <Text style={styles.enemyName}>{currentEnemy.name} - HP {currentEnemy.hp}/{currentEnemy.maxHp}</Text>
                            <Image source={currentEnemy.imageUrl} resizeMode="contain" style={styles.enemy} />
                            <View style={styles.stageStats}>
                                <Text style={styles.stageStat}>Streak {session.streakCount}</Text>
                                <Text style={styles.stageStat}>Cleared {enemiesKilled}</Text>
                                <Text style={styles.stageStat}>Round {progress}</Text>
                            </View>
                        </Card>

                        <Card style={styles.answerCard}>
                            {feedback ? <Text style={[styles.feedback, { color: feedback === "Correct" ? "#4ade80" : "#f87171" }]}>{feedback}</Text> : null}
                            <Text style={styles.answerLabel}>{promptInfo.answerLabel}</Text>
                            <Text style={styles.prompt}>{promptInfo.prompt}</Text>
                            {session.currentWord.hint ? <Text style={styles.hint}>{session.currentWord.hint}</Text> : null}

                            {finishState ? (
                                <View style={styles.result}>
                                    <Text style={[styles.resultTitle, { color: palette.accent }]}>{finishState.title}</Text>
                                    <Text style={styles.resultText}>{finishState.message}</Text>
                                    <View style={styles.resultStats}>
                                        <StatPill label="Correct" value={session.correctAnswers} />
                                        <StatPill label="Best" value={session.bestStreak} />
                                    </View>
                                    <Button title="Run again" onPress={beginRun} />
                                    <Button title="Back to decks" variant="secondary" onPress={() => navigation.goBack()} />
                                </View>
                            ) : (
                                <>
                                    <TextField
                                        value={answer}
                                        onChangeText={setAnswer}
                                        placeholder="Type answer"
                                        returnKeyType="send"
                                        onSubmitEditing={() => submitAnswer()}
                                        autoCorrect={false}
                                    />
                                    <View style={styles.answerActions}>
                                        <Button title="Submit" onPress={() => submitAnswer()} disabled={!answer.trim()} />
                                        <Button title="End" variant="secondary" onPress={finishRun} />
                                    </View>
                                </>
                            )}
                        </Card>
                    </View>
                </Screen>
            </View>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.62)"
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12
    },
    loadingText: {
        color: "rgba(255,255,255,0.76)",
        fontWeight: "800"
    },
    error: {
        color: "#fca5a5",
        fontWeight: "800"
    },
    gameLayout: {
        flex: 1,
        gap: 12
    },
    hud: {
        flexDirection: "row",
        gap: 8
    },
    stageCard: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    zone: {
        fontSize: 21,
        fontWeight: "900",
        letterSpacing: 0
    },
    enemyName: {
        color: "rgba(255,255,255,0.72)",
        fontSize: 13,
        fontWeight: "800"
    },
    enemy: {
        width: "100%",
        height: 190
    },
    stageStats: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8
    },
    stageStat: {
        color: "rgba(255,255,255,0.72)",
        fontSize: 12,
        fontWeight: "800"
    },
    answerCard: {
        minHeight: 236
    },
    feedback: {
        fontSize: 13,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 0
    },
    answerLabel: {
        color: "rgba(255,255,255,0.62)",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 0
    },
    prompt: {
        color: "#ffffff",
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: 0
    },
    hint: {
        color: "rgba(255,255,255,0.68)",
        fontSize: 13,
        lineHeight: 19
    },
    answerActions: {
        flexDirection: "row",
        gap: 10
    },
    result: {
        gap: 12
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: "900",
        letterSpacing: 0
    },
    resultText: {
        color: "rgba(255,255,255,0.72)",
        fontSize: 14,
        lineHeight: 20
    },
    resultStats: {
        flexDirection: "row",
        gap: 10
    }
})
