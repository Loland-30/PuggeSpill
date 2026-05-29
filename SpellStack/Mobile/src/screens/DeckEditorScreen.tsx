import { useEffect, useState } from "react"
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import { Plus, Trash2 } from "lucide-react-native"

import { createDeck, getDeck, updateDeck } from "../api/decks"
import { addWord, deleteWord, updateWord } from "../api/words"
import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { Screen } from "../components/Screen"
import { SegmentedControl } from "../components/SegmentedControl"
import { TextField } from "../components/TextField"
import { languages } from "../data/languages"
import { spanishDeckPresets } from "../data/spanishDeckPresets"
import type { RootStackParamList } from "../navigation/types"
import { useTheme } from "../theme/ThemeContext"

interface WordDraft {
    clientId: string
    id?: number
    original: string
    translation: string
    alternativeOriginal: string
    alternativeTranslation: string
    hint: string
}

type LearningSide = "source" | "target"

function createClientId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createWordDraft(): WordDraft {
    return {
        clientId: createClientId(),
        original: "",
        translation: "",
        alternativeOriginal: "",
        alternativeTranslation: "",
        hint: ""
    }
}

function serialize(value: string) {
    const clean = value.trim()
    return clean ? clean : null
}

export function DeckEditorScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, "DeckEditor">>()
    const { palette } = useTheme()
    const deckId = route.params?.deckId
    const isEditing = typeof deckId === "number"

    const [deckName, setDeckName] = useState("")
    const [description, setDescription] = useState("")
    const [language, setLanguage] = useState("es")
    const [translationLanguage, setTranslationLanguage] = useState("en")
    const [learningSide, setLearningSide] = useState<LearningSide>("source")
    const [words, setWords] = useState<WordDraft[]>([createWordDraft()])
    const [removedWordIds, setRemovedWordIds] = useState<number[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isEditing || !deckId) return

        setLoading(true)
        getDeck(deckId)
            .then(deck => {
                setDeckName(deck.name)
                setDescription(deck.description)
                setLanguage(deck.language || "es")
                setTranslationLanguage(deck.translationLanguage || "en")
                setLearningSide(deck.learningLanguage === deck.language ? "source" : "target")
                setWords(deck.words.length > 0
                    ? deck.words.map(word => ({
                        clientId: createClientId(),
                        id: word.id,
                        original: word.original,
                        translation: word.translation,
                        alternativeOriginal: word.alternativeOriginal ?? "",
                        alternativeTranslation: word.alternativeTranslation ?? "",
                        hint: word.hint ?? ""
                    }))
                    : [createWordDraft()])
            })
            .catch(error => Alert.alert("Deck", error instanceof Error ? error.message : "Could not load deck"))
            .finally(() => setLoading(false))
    }, [deckId, isEditing])

    const updateWordDraft = (clientId: string, patch: Partial<WordDraft>) => {
        setWords(current => current.map(word => word.clientId === clientId ? { ...word, ...patch } : word))
    }

    const removeWordDraft = (word: WordDraft) => {
        if (word.id) setRemovedWordIds(current => [...current, word.id!])
        setWords(current => current.length <= 1 ? [createWordDraft()] : current.filter(candidate => candidate.clientId !== word.clientId))
    }

    const applyPreset = () => {
        const preset = spanishDeckPresets[0]
        setDeckName(preset.name)
        setDescription(preset.description)
        setLanguage("es")
        setTranslationLanguage("en")
        setLearningSide("source")
        setWords(preset.words.map(word => ({
            clientId: createClientId(),
            original: word.original,
            translation: word.translation,
            alternativeOriginal: word.acceptedOriginals?.join(", ") ?? "",
            alternativeTranslation: "",
            hint: ""
        })))
    }

    const save = async () => {
        if (!deckName.trim() || !language.trim()) return

        setSaving(true)
        try {
            const learningLanguage = learningSide === "source" ? language : translationLanguage
            const savedDeck = isEditing && deckId
                ? await updateDeck(deckId, deckName.trim(), language, translationLanguage, learningLanguage, description.trim())
                : await createDeck(deckName.trim(), language, translationLanguage, learningLanguage, description.trim())

            await Promise.all(removedWordIds.map(id => deleteWord(id)))

            const validWords = words.filter(word => word.original.trim() && word.translation.trim())
            await Promise.all(validWords.map(word => {
                if (word.id) {
                    return updateWord(
                        word.id,
                        word.original.trim(),
                        word.translation.trim(),
                        serialize(word.hint),
                        savedDeck.id,
                        serialize(word.alternativeTranslation),
                        serialize(word.alternativeOriginal)
                    )
                }

                return addWord(
                    word.original.trim(),
                    word.translation.trim(),
                    serialize(word.hint),
                    savedDeck.id,
                    serialize(word.alternativeTranslation),
                    serialize(word.alternativeOriginal)
                )
            }))

            navigation.goBack()
        } catch (saveError) {
            Alert.alert("Save deck", saveError instanceof Error ? saveError.message : "Could not save deck")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Screen
            title={isEditing ? "Edit Deck" : "Create Deck"}
            subtitle={isEditing ? "Tune the word list for mobile practice." : "Build a deck for mobile runs."}
        >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Card>
                    <TextField label="Deck name" value={deckName} onChangeText={setDeckName} placeholder="Spanish basics" />
                    <TextField label="Description" value={description} onChangeText={setDescription} placeholder="Common starter words" />

                    <Text style={styles.label}>Learning side</Text>
                    <SegmentedControl
                        value={learningSide}
                        onChange={setLearningSide}
                        options={[
                            { label: "Source", value: "source" },
                            { label: "Target", value: "target" }
                        ]}
                    />

                    <Text style={styles.label}>Source language</Text>
                    <View style={styles.languageGrid}>
                        {languages.slice(0, 6).map(option => (
                            <Pressable
                                key={option.code}
                                onPress={() => setLanguage(option.code)}
                                style={[
                                    styles.languageButton,
                                    {
                                        borderColor: palette.border,
                                        backgroundColor: language === option.code ? palette.primary : palette.mutedCard
                                    }
                                ]}
                            >
                                <Text style={[styles.languageText, { color: language === option.code ? palette.primaryText : "#ffffff" }]}>{option.label}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <TextField label="Translation language code" value={translationLanguage} onChangeText={setTranslationLanguage} placeholder="en" />

                    {!isEditing ? <Button title="Apply Spanish preset" variant="secondary" onPress={applyPreset} /> : null}
                </Card>

                <View style={styles.wordsHeader}>
                    <Text style={[styles.wordsTitle, { color: palette.accent }]}>Words</Text>
                    <Pressable style={[styles.iconButton, { borderColor: palette.border, backgroundColor: palette.mutedCard }]} onPress={() => setWords(current => [...current, createWordDraft()])}>
                        <Plus color="#ffffff" size={21} />
                    </Pressable>
                </View>

                {words.map((word, index) => (
                    <Card key={word.clientId}>
                        <View style={styles.wordHeader}>
                            <Text style={styles.wordIndex}>Word {index + 1}</Text>
                            <Pressable style={styles.trashButton} onPress={() => removeWordDraft(word)}>
                                <Trash2 color="#fca5a5" size={18} />
                            </Pressable>
                        </View>
                        <TextField label="Source" value={word.original} onChangeText={value => updateWordDraft(word.clientId, { original: value })} placeholder="hola" />
                        <TextField label="Translation" value={word.translation} onChangeText={value => updateWordDraft(word.clientId, { translation: value })} placeholder="hello" />
                        <TextField label="Accepted source answers" value={word.alternativeOriginal} onChangeText={value => updateWordDraft(word.clientId, { alternativeOriginal: value })} placeholder="comma separated" />
                        <TextField label="Accepted translation answers" value={word.alternativeTranslation} onChangeText={value => updateWordDraft(word.clientId, { alternativeTranslation: value })} placeholder="comma separated" />
                        <TextField label="Hint" value={word.hint} onChangeText={value => updateWordDraft(word.clientId, { hint: value })} placeholder="optional" />
                    </Card>
                ))}

                <Button title={isEditing ? "Save changes" : "Create deck"} onPress={save} loading={saving || loading} disabled={!deckName.trim() || !language.trim()} />
            </ScrollView>
        </Screen>
    )
}

const styles = StyleSheet.create({
    content: {
        gap: 14,
        paddingBottom: 24
    },
    label: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 0
    },
    languageGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    languageButton: {
        minHeight: 38,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        justifyContent: "center"
    },
    languageText: {
        fontSize: 13,
        fontWeight: "800"
    },
    wordsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    wordsTitle: {
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: 0
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    wordHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    wordIndex: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "900"
    },
    trashButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(127,29,29,0.28)"
    }
})
