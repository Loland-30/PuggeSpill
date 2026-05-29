import { useCallback, useMemo, useState } from "react"
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Pencil, Play, Plus, RefreshCw, Trash2 } from "lucide-react-native"

import { deleteDeck, getDecks, type Deck } from "../api/decks"
import type { MainTabParamList, RootStackParamList } from "../navigation/types"
import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { EmptyState } from "../components/EmptyState"
import { GameModeModal } from "../components/GameModeModal"
import { Screen } from "../components/Screen"
import { StatPill } from "../components/StatPill"
import { getLanguageLabel } from "../data/languages"
import { useTheme } from "../theme/ThemeContext"

type DecksNavigation = BottomTabNavigationProp<MainTabParamList, "Decks"> & NativeStackNavigationProp<RootStackParamList>

export function DecksScreen() {
    const navigation = useNavigation<DecksNavigation>()
    const { palette } = useTheme()
    const [decks, setDecks] = useState<Deck[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)

    const loadDecks = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            setDecks(await getDecks())
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load decks")
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(useCallback(() => {
        loadDecks()
    }, [loadDecks]))

    const totalWords = useMemo(() => decks.reduce((sum, deck) => sum + deck.words.length, 0), [decks])

    const confirmDelete = (deck: Deck) => {
        Alert.alert("Delete deck", `Delete ${deck.name}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    await deleteDeck(deck.id)
                    setDecks(current => current.filter(candidate => candidate.id !== deck.id))
                }
            }
        ])
    }

    return (
        <Screen
            title="Decks"
            subtitle={`${decks.length} decks - ${totalWords} words`}
            rightAction={
                <Pressable style={[styles.iconButton, { borderColor: palette.border, backgroundColor: palette.mutedCard }]} onPress={() => navigation.navigate("DeckEditor", undefined)}>
                    <Plus color="#ffffff" size={22} />
                </Pressable>
            }
        >
            <GameModeModal
                deck={selectedDeck}
                visible={selectedDeck !== null}
                onClose={() => setSelectedDeck(null)}
                onStart={(direction, modifiers, roundLimit) => {
                    const deck = selectedDeck
                    setSelectedDeck(null)
                    if (!deck) return
                    navigation.navigate("Play", {
                        deckId: deck.id,
                        deckName: deck.name,
                        direction,
                        modifiers,
                        roundLimit
                    })
                }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDecks} tintColor="#ffffff" />}
                contentContainerStyle={styles.list}
            >
                {error ? (
                    <Card>
                        <Text style={styles.error}>{error}</Text>
                        <Button title="Retry" onPress={loadDecks} icon={<RefreshCw color="#ffffff" size={18} />} />
                    </Card>
                ) : null}

                {!loading && decks.length === 0 ? (
                    <EmptyState
                        title="No decks yet"
                        message="Create your first deck and start a run."
                        actionLabel="Create deck"
                        onAction={() => navigation.navigate("DeckEditor", undefined)}
                    />
                ) : null}

                {decks.map(deck => (
                    <Card key={deck.id}>
                        <View style={styles.deckHeader}>
                            <View style={styles.deckTitleWrap}>
                                <Text style={styles.deckName}>{deck.name}</Text>
                                <Text style={styles.deckMeta}>
                                    {getLanguageLabel(deck.learningLanguage || deck.language)} - {deck.words.length} words
                                </Text>
                            </View>
                            <Text style={[styles.score, { color: palette.accent }]}>{deck.highScore}</Text>
                        </View>

                        {deck.description ? <Text style={styles.description}>{deck.description}</Text> : null}

                        <View style={styles.stats}>
                            <StatPill label="From" value={getLanguageLabel(deck.translationLanguage || "no")} />
                            <StatPill label="Learning" value={getLanguageLabel(deck.learningLanguage || deck.language)} />
                        </View>

                        <View style={styles.actions}>
                            <Button title="Play" onPress={() => setSelectedDeck(deck)} icon={<Play color={palette.primaryText} size={18} />} />
                            <Button title="Edit" variant="secondary" onPress={() => navigation.navigate("DeckEditor", { deckId: deck.id })} icon={<Pencil color="#ffffff" size={17} />} />
                            <Pressable style={[styles.deleteButton, { borderColor: "rgba(248,113,113,0.55)" }]} onPress={() => confirmDelete(deck)}>
                                <Trash2 color="#fca5a5" size={19} />
                            </Pressable>
                        </View>
                    </Card>
                ))}
            </ScrollView>
        </Screen>
    )
}

const styles = StyleSheet.create({
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    list: {
        gap: 14,
        paddingBottom: 18
    },
    error: {
        color: "#fca5a5",
        fontWeight: "800"
    },
    deckHeader: {
        flexDirection: "row",
        gap: 12,
        alignItems: "flex-start",
        justifyContent: "space-between"
    },
    deckTitleWrap: {
        flex: 1,
        gap: 3
    },
    deckName: {
        color: "#ffffff",
        fontSize: 21,
        fontWeight: "900",
        letterSpacing: 0
    },
    deckMeta: {
        color: "rgba(255,255,255,0.62)",
        fontSize: 13,
        fontWeight: "700"
    },
    score: {
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: 0
    },
    description: {
        color: "rgba(255,255,255,0.72)",
        lineHeight: 20
    },
    stats: {
        flexDirection: "row",
        gap: 10
    },
    actions: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center"
    },
    deleteButton: {
        width: 48,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(127,29,29,0.28)"
    }
})
