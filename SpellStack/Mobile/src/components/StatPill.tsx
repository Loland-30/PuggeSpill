import { StyleSheet, Text, View } from "react-native"

import { useTheme } from "../theme/ThemeContext"

interface StatPillProps {
    label: string
    value: string | number
}

export function StatPill({ label, value }: StatPillProps) {
    const { palette } = useTheme()

    return (
        <View style={[styles.pill, { borderColor: palette.border, backgroundColor: palette.mutedCard }]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={[styles.value, { color: palette.accent }]} numberOfLines={1}>{value}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    pill: {
        flex: 1,
        minHeight: 64,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        justifyContent: "center",
        gap: 2
    },
    label: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0
    },
    value: {
        color: "#ffffff",
        fontSize: 19,
        fontWeight: "900",
        letterSpacing: 0
    }
})
