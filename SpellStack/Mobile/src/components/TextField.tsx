import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native"

import { useTheme } from "../theme/ThemeContext"

interface TextFieldProps extends TextInputProps {
    label?: string
}

export function TextField({ label, style, ...props }: TextFieldProps) {
    const { palette } = useTheme()

    return (
        <View style={styles.wrap}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                placeholderTextColor="rgba(255,255,255,0.42)"
                selectionColor={palette.accent}
                autoCapitalize="none"
                {...props}
                style={[
                    styles.input,
                    {
                        borderColor: palette.border,
                        backgroundColor: palette.mutedCard
                    },
                    style
                ]}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    wrap: {
        gap: 6
    },
    label: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0
    },
    input: {
        minHeight: 48,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "700"
    }
})
