import { useState } from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"

import type { Deck } from "../api/decks"
import type { ActiveGameModifier, GameDirection, RoundLimit } from "../api/gameSession"
import { useTheme } from "../theme/ThemeContext"
import { Button } from "./Button"
import { Card } from "./Card"
import { SegmentedControl } from "./SegmentedControl"

interface GameModeModalProps {
    deck: Deck | null
    visible: boolean
    onClose: () => void
    onStart: (direction: GameDirection, modifiers: ActiveGameModifier[], roundLimit: RoundLimit) => void
}

const modifierOptions: Array<{ label: string; value: ActiveGameModifier }> = [
    { label: "Zen", value: "zen" },
    { label: "+Heart", value: "extraHeart" },
    { label: "Hardcore", value: "hardcore" },
    { label: "Momentum", value: "momentum" }
]

export function GameModeModal({ deck, visible, onClose, onStart }: GameModeModalProps) {
    const { palette } = useTheme()
    const [direction, setDirection] = useState<GameDirection>("original")
    const [roundLimit, setRoundLimit] = useState<RoundLimit>(25)
    const [modifiers, setModifiers] = useState<ActiveGameModifier[]>([])

    const toggleModifier = (modifier: ActiveGameModifier) => {
        setModifiers(current =>
            current.includes(modifier)
                ? current.filter(value => value !== modifier)
                : [...current, modifier]
        )
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet}>
                    <Card>
                        <Text style={[styles.title, { color: palette.accent }]}>{deck?.name ?? "Play"}</Text>
                        <Text style={styles.caption}>{deck?.words.length ?? 0} words</Text>

                        <Text style={styles.label}>Direction</Text>
                        <SegmentedControl
                            value={direction}
                            onChange={setDirection}
                            options={[
                                { label: "Source", value: "original" },
                                { label: "Target", value: "translation" },
                                { label: "Mixed", value: "mixed" }
                            ]}
                        />

                        <Text style={styles.label}>Rounds</Text>
                        <SegmentedControl
                            value={roundLimit}
                            onChange={setRoundLimit}
                            options={[
                                { label: "10", value: 10 },
                                { label: "25", value: 25 },
                                { label: "50", value: 50 },
                                { label: "Endless", value: null }
                            ]}
                        />

                        <Text style={styles.label}>Modifiers</Text>
                        <View style={styles.modifiers}>
                            {modifierOptions.map(option => {
                                const active = modifiers.includes(option.value)
                                return (
                                    <Pressable
                                        key={option.value}
                                        onPress={() => toggleModifier(option.value)}
                                        style={[
                                            styles.modifier,
                                            {
                                                borderColor: palette.border,
                                                backgroundColor: active ? palette.primary : palette.mutedCard
                                            }
                                        ]}
                                    >
                                        <Text style={[styles.modifierText, { color: active ? palette.primaryText : "#ffffff" }]}>{option.label}</Text>
                                    </Pressable>
                                )
                            })}
                        </View>

                        <View style={styles.actions}>
                            <Button title="Cancel" variant="secondary" onPress={onClose} />
                            <Button title="Start" onPress={() => onStart(direction, modifiers, roundLimit)} />
                        </View>
                    </Card>
                </Pressable>
            </Pressable>
        </Modal>
    )
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.72)",
        justifyContent: "flex-end",
        padding: 18
    },
    sheet: {
        width: "100%"
    },
    title: {
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: 0
    },
    caption: {
        color: "rgba(255,255,255,0.62)",
        fontSize: 13,
        fontWeight: "700"
    },
    label: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 0
    },
    modifiers: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    modifier: {
        minHeight: 38,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        justifyContent: "center"
    },
    modifierText: {
        fontSize: 13,
        fontWeight: "800"
    },
    actions: {
        flexDirection: "row",
        gap: 10
    }
})
