import { Pressable, StyleSheet, Text, View } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { LinearGradient } from "expo-linear-gradient"

import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { Screen } from "../components/Screen"
import type { RootStackParamList } from "../navigation/types"
import { useTheme } from "../theme/ThemeContext"
import { backgroundThemes, paletteThemes } from "../theme/themes"

export function ThemeScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const { theme, updateTheme, palette } = useTheme()

    return (
        <Screen title="Theme" subtitle="Match the mobile app to your SpellStack style.">
            <Card>
                <Text style={[styles.sectionTitle, { color: palette.accent }]}>Background</Text>
                <View style={styles.grid}>
                    {backgroundThemes.map(option => {
                        const active = theme.backgroundId === option.id
                        return (
                            <Pressable
                                key={option.id}
                                onPress={() => updateTheme({ backgroundId: option.id })}
                                style={[styles.themeItem, active && { borderColor: palette.accent }]}
                            >
                                <LinearGradient colors={option.colors} style={styles.preview} />
                                <Text style={styles.itemLabel}>{option.name}</Text>
                            </Pressable>
                        )
                    })}
                </View>
            </Card>

            <Card>
                <Text style={[styles.sectionTitle, { color: palette.accent }]}>Palette</Text>
                <View style={styles.grid}>
                    {paletteThemes.map(option => {
                        const active = theme.paletteId === option.id
                        return (
                            <Pressable
                                key={option.id}
                                onPress={() => updateTheme({ paletteId: option.id })}
                                style={[styles.themeItem, active && { borderColor: palette.accent }]}
                            >
                                {option.gradient ? (
                                    <LinearGradient colors={option.gradient} style={styles.swatch} />
                                ) : (
                                    <View style={[styles.swatch, { backgroundColor: option.primary }]} />
                                )}
                                <Text style={styles.itemLabel}>{option.name}</Text>
                            </Pressable>
                        )
                    })}
                </View>
            </Card>

            <Button title="Done" onPress={() => navigation.goBack()} />
        </Screen>
    )
}

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 0
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10
    },
    themeItem: {
        width: "47%",
        minHeight: 86,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        borderRadius: 8,
        padding: 8,
        gap: 8,
        backgroundColor: "rgba(255,255,255,0.08)"
    },
    preview: {
        height: 38,
        borderRadius: 6
    },
    swatch: {
        height: 38,
        borderRadius: 6
    },
    itemLabel: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "800"
    }
})
