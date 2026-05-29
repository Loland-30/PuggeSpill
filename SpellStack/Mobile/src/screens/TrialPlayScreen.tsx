import { useMemo, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import type { RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { Screen } from "../components/Screen"
import { StatPill } from "../components/StatPill"
import { TextField } from "../components/TextField"
import { trials } from "../data/trials/trials"
import { useTrialSession } from "../hooks/useTrialSession"
import type { RootStackParamList } from "../navigation/types"
import { useTheme } from "../theme/ThemeContext"

export function TrialPlayScreen() {
    const route = useRoute<RouteProp<RootStackParamList, "TrialPlay">>()
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const { palette } = useTheme()
    const trial = useMemo(() => trials.find(candidate => candidate.id === route.params.trialId) ?? trials[0], [route.params.trialId])
    const session = useTrialSession(trial)
    const [answer, setAnswer] = useState("")

    const submit = () => {
        if (!answer.trim()) return
        session.submitAnswer(answer)
        setAnswer("")
    }

    return (
        <Screen title={trial.title} subtitle={`Level ${trial.level} - ${trial.passingCorrect} correct to pass`}>
            <View style={styles.stats}>
                <StatPill label="Question" value={`${Math.min(session.currentIndex + 1, session.questionCount)}/${session.questionCount}`} />
                <StatPill label="Correct" value={session.correctCount} />
                <StatPill label="Accuracy" value={`${session.accuracy}%`} />
            </View>

            <Card>
                {session.isComplete ? (
                    <View style={styles.result}>
                        <Text style={[styles.rank, { color: session.rank.color }]}>{session.rank.rank}</Text>
                        <Text style={[styles.resultTitle, { color: palette.accent }]}>{session.rank.label}</Text>
                        <Text style={styles.resultText}>
                            {session.correctCount} of {session.questionCount} correct - {session.passed ? "Passed" : "Not passed"}
                        </Text>
                        <Button title="Retry" onPress={session.restart} />
                        <Button title="Back to trials" variant="secondary" onPress={() => navigation.goBack()} />
                    </View>
                ) : (
                    <>
                        <Text style={styles.label}>Translate</Text>
                        <Text style={styles.prompt}>{session.currentQuestion?.source}</Text>
                        <TextField
                            value={answer}
                            onChangeText={setAnswer}
                            placeholder="Your answer"
                            returnKeyType="send"
                            onSubmitEditing={submit}
                            autoCorrect={false}
                        />
                        <Button title="Submit" onPress={submit} disabled={!answer.trim()} />
                    </>
                )}
            </Card>

            {session.answers.length > 0 ? (
                <Card>
                    <Text style={styles.historyTitle}>Answers</Text>
                    {session.answers.slice(-6).map((record, index) => (
                        <Text key={`${record.question.source}-${index}`} style={styles.historyItem}>
                            {record.correct ? "OK" : "Miss"} - {record.question.source} to {record.answer || "blank"}
                        </Text>
                    ))}
                </Card>
            ) : null}
        </Screen>
    )
}

const styles = StyleSheet.create({
    stats: {
        flexDirection: "row",
        gap: 8
    },
    label: {
        color: "rgba(255,255,255,0.62)",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 0
    },
    prompt: {
        color: "#ffffff",
        fontSize: 34,
        fontWeight: "900",
        letterSpacing: 0
    },
    result: {
        gap: 12,
        alignItems: "center"
    },
    rank: {
        fontSize: 72,
        fontWeight: "900",
        letterSpacing: 0
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: 0
    },
    resultText: {
        color: "rgba(255,255,255,0.72)",
        textAlign: "center",
        lineHeight: 20
    },
    historyTitle: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "900"
    },
    historyItem: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
        lineHeight: 20
    }
})
