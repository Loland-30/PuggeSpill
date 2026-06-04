import { Pressable, StyleSheet, Text, View } from "react-native"

import { useTheme } from "../theme/ThemeContext"

interface Option<T extends string | number | null> {
    label: string
    value: T
}

interface SegmentedControlProps<T extends string | number | null> {
    options: Option<T>[]
    value: T
    onChange: (value: T) => void
}

export function SegmentedControl<T extends string | number | null>({ options, value, onChange }: SegmentedControlProps<T>) {
    const { palette } = useTheme()

    return (
        <View style={[styles.wrap, { borderColor: palette.border, backgroundColor: palette.mutedCard }]}>
            {options.map(option => {
                const active = option.value === value
                return (
                    <Pressable
                        key={`${option.value}`}
                        onPress={() => onChange(option.value)}
                        style={[styles.option, active && { backgroundColor: palette.primary }]}
                    >
                        <Text style={[styles.label, { color: active ? palette.primaryText : "rgba(255,255,255,0.72)" }]} numberOfLines={1}>
                            {option.label}
                        </Text>
                    </Pressable>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    wrap: {
        minHeight: 46,
        borderWidth: 1,
        borderRadius: 8,
        padding: 4,
        flexDirection: "row",
        gap: 4
    },
    option: {
        flex: 1,
        minHeight: 36,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8
    },
    label: {
        fontSize: 13,
        fontWeight: "800",
        letterSpacing: 0
    }
})
