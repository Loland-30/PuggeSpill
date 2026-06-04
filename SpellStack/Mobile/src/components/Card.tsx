import type { ReactNode } from "react"
import { StyleSheet, View, type ViewStyle } from "react-native"

import { useTheme } from "../theme/ThemeContext"

interface CardProps {
    children: ReactNode
    style?: ViewStyle
}

export function Card({ children, style }: CardProps) {
    const { palette } = useTheme()

    return (
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }, style]}>
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        gap: 12
    }
})
