import { StyleSheet, Text, View } from "react-native"

import { Button } from "./Button"
import { Card } from "./Card"

interface EmptyStateProps {
    title: string
    message: string
    actionLabel?: string
    onAction?: () => void
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
    return (
        <Card>
            <View style={styles.wrap}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
                {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} /> : null}
            </View>
        </Card>
    )
}

const styles = StyleSheet.create({
    wrap: {
        gap: 10,
        alignItems: "center",
        paddingVertical: 10
    },
    title: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: 0
    },
    message: {
        color: "rgba(255,255,255,0.66)",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20
    }
})
