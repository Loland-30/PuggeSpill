import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Play } from "lucide-react-native"

import trialImage from "../assets/Es-Trial-Rank-img.webp"
import { Card } from "../components/Card"
import { Screen } from "../components/Screen"
import { trials } from "../data/trials/trials"
import type { RootStackParamList } from "../navigation/types"
import { useTheme } from "../theme/ThemeContext"

export function TrialsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const { palette } = useTheme()

    return (
        <Screen title="Trials" subtitle="Fixed challenge runs for focused practice.">
            {trials.map(trial => (
                <Pressable key={trial.id} onPress={() => navigation.navigate("TrialPlay", { trialId: trial.id })}>
                    <Card>
                        <View style={styles.row}>
                            <Image source={trialImage} style={styles.image} resizeMode="cover" />
                            <View style={styles.info}>
                                <Text style={[styles.title, { color: palette.accent }]}>{trial.title}</Text>
                                <Text style={styles.meta}>Level {trial.level} - {trial.questionCount} questions</Text>
                                <Text style={styles.meta}>Pass with {trial.passingCorrect} correct</Text>
                            </View>
                            <View style={[styles.play, { backgroundColor: palette.primary }]}>
                                <Play color={palette.primaryText} size={20} />
                            </View>
                        </View>
                    </Card>
                </Pressable>
            ))}
        </Screen>
    )
}

const styles = StyleSheet.create({
    row: {
        minHeight: 118,
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    image: {
        width: 82,
        height: 92,
        borderRadius: 8
    },
    info: {
        flex: 1,
        gap: 5
    },
    title: {
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: 0
    },
    meta: {
        color: "rgba(255,255,255,0.68)",
        fontSize: 13,
        fontWeight: "700"
    },
    play: {
        width: 42,
        height: 42,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center"
    }
})
