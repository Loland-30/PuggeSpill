import { LinearGradient } from "expo-linear-gradient"
import type { ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useTheme } from "../theme/ThemeContext"

interface ScreenProps {
    title?: string
    subtitle?: string
    children: ReactNode
    scroll?: boolean
    rightAction?: ReactNode
    transparent?: boolean
}

export function Screen({ title, subtitle, children, scroll = true, rightAction, transparent = false }: ScreenProps) {
    const { background, palette } = useTheme()

    const content = (
        <View style={styles.content}>
            {(title || subtitle || rightAction) && (
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        {title && <Text style={[styles.title, { color: palette.accent }]}>{title}</Text>}
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>
                    {rightAction}
                </View>
            )}
            {children}
        </View>
    )

    const screen = (
        <View style={[styles.root, transparent && styles.transparentRoot]}>
            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.keyboard}
                >
                    {scroll ? (
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {content}
                        </ScrollView>
                    ) : content}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    )

    if (transparent) return screen

    return (
        <LinearGradient colors={background.colors} style={styles.root}>
            {screen}
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1
    },
    transparentRoot: {
        backgroundColor: "transparent"
    },
    safe: {
        flex: 1
    },
    keyboard: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 18,
        gap: 16
    },
    header: {
        minHeight: 54,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14
    },
    headerText: {
        flex: 1,
        gap: 2
    },
    title: {
        fontSize: 30,
        fontWeight: "900",
        letterSpacing: 0
    },
    subtitle: {
        color: "rgba(255,255,255,0.66)",
        fontSize: 14,
        lineHeight: 20
    }
})
