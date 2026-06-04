import { LinearGradient } from "expo-linear-gradient"
import type { ReactNode } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"

import { useTheme } from "../theme/ThemeContext"

interface ButtonProps {
    title: string
    onPress: () => void
    variant?: "primary" | "secondary" | "danger" | "ghost"
    disabled?: boolean
    loading?: boolean
    icon?: ReactNode
}

export function Button({ title, onPress, variant = "primary", disabled = false, loading = false, icon }: ButtonProps) {
    const { palette } = useTheme()
    const isPrimary = variant === "primary"
    const isDanger = variant === "danger"
    const backgroundColor = isPrimary ? palette.primary : isDanger ? "rgba(239, 68, 68, 0.9)" : variant === "ghost" ? "transparent" : palette.mutedCard
    const textColor = isPrimary ? palette.primaryText : isDanger ? "#ffffff" : "#ffffff"

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.button,
                {
                    opacity: disabled ? 0.46 : pressed ? 0.8 : 1,
                    borderColor: variant === "ghost" ? "transparent" : palette.border,
                    backgroundColor
                }
            ]}
        >
            {isPrimary && palette.gradient ? (
                <LinearGradient colors={palette.gradient} style={StyleSheet.absoluteFill} />
            ) : null}
            <View style={styles.content}>
                {loading ? <ActivityIndicator color={textColor} /> : icon}
                <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>{title}</Text>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 8,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center"
    },
    content: {
        minHeight: 46,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8
    },
    text: {
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0
    }
})
