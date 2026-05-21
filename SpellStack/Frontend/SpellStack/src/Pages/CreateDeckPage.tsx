import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Check, ChevronDown, Library, RotateCcw, X } from "lucide-react"

import { createDeck, getDeck, updateDeck } from "../api/decks"
import { addWord, deleteWord, updateWord } from "../api/words"
import FadeIn from "../components/FadeIn"
import GradientFrame from "../components/GradientFrame"
import LanguageSelect from "../components/LanguageSelect"
import AppPageShell from "../components/layout/AppPageShell"
import PageContentTransition from "../components/PageContentTransition"
import { spanishDeckPresets, type SpanishDeckPreset } from "../data/spanishDeckPresets"
import { useTheme } from "../theme/ThemeContext"

interface WordPair {
    clientId: string
    id?: number
    original: string
    translation: string
    acceptedOriginals: string[]
    acceptedAnswers: string[]
    hint: string
}

type LearningLanguageSide = "source" | "target"
type WordEditableField = "original" | "translation"

function createClientId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createEmptyWordPair(): WordPair {
    return {
        clientId: createClientId(),
        original: "",
        translation: "",
        acceptedOriginals: [],
        acceptedAnswers: [],
        hint: ""
    }
}

function splitAcceptedAnswers(value: string | null | undefined) {
    return value?.split(",").map(answer => answer.trim()).filter(Boolean) ?? []
}

function serializeAcceptedAnswers(answers: string[]) {
    const cleanedAnswers = answers.map(answer => answer.trim()).filter(Boolean)
    return cleanedAnswers.length > 0 ? cleanedAnswers.join(",") : null
}

function getAcceptedAnswersForSide(word: WordPair, side: LearningLanguageSide) {
    return side === "source" ? word.acceptedOriginals : word.acceptedAnswers
}

export default function CreateDeckPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditing = !!id
    const { palette, textTone } = useTheme()

    const [deckName, setDeckName] = useState("")
    const [translationLanguage, setTranslationLanguage] = useState("no")
    const [language, setLanguage] = useState("")
    const [learningLanguageSide, setLearningLanguageSide] = useState<LearningLanguageSide>("target")
    const [description, setDescription] = useState("")
    const [words, setWords] = useState<WordPair[]>(() => [createEmptyWordPair()])
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
    const [showPresets, setShowPresets] = useState(false)

    useEffect(() => {
        if (!isEditing) return

        getDeck(Number(id)).then(deck => {
            setDeckName(deck.name)
            setLanguage(deck.language)
            setTranslationLanguage(deck.translationLanguage)
            setLearningLanguageSide(deck.learningLanguage === deck.language ? "source" : "target")
            setDescription(deck.description)
            setWords(deck.words.map(word => ({
                clientId: createClientId(),
                id: word.id,
                original: word.original,
                translation: word.translation,
                acceptedOriginals: splitAcceptedAnswers(word.alternativeOriginal),
                acceptedAnswers: splitAcceptedAnswers(word.alternativeTranslation),
                hint: word.hint ?? ""
            })))
        })
    }, [id, isEditing])

    const addWordRow = () => {
        setSelectedPresetId(null)
        setWords(currentWords => [...currentWords, createEmptyWordPair()])
    }

    const updateWordRow = (clientId: string, field: WordEditableField, value: string) => {
        setSelectedPresetId(null)
        setWords(currentWords =>
            currentWords.map(word =>
                word.clientId === clientId
                    ? { ...word, [field]: value }
                    : word
            )
        )
    }

    const toggleAcceptedAnswers = (clientId: string) => {
        const isCurrentlyExpanded = !!expandedRows[clientId]

        if (!isCurrentlyExpanded) {
            setWords(currentWords =>
                currentWords.map(word => {
                    if (word.clientId !== clientId) return word
                    if (getAcceptedAnswersForSide(word, learningLanguageSide).length > 0) return word

                    return learningLanguageSide === "source"
                        ? { ...word, acceptedOriginals: [""] }
                        : { ...word, acceptedAnswers: [""] }
                })
            )
        }

        setExpandedRows(currentRows => ({
            ...currentRows,
            [clientId]: !currentRows[clientId]
        }))
    }

    const updateAcceptedAnswer = (clientId: string, answerIndex: number, value: string) => {
        setSelectedPresetId(null)
        setWords(currentWords =>
            currentWords.map(word => {
                if (word.clientId !== clientId) return word

                if (learningLanguageSide === "source") {
                    return {
                        ...word,
                        acceptedOriginals: word.acceptedOriginals.map((answer, index) =>
                            index === answerIndex ? value : answer
                        )
                    }
                }

                return {
                    ...word,
                    acceptedAnswers: word.acceptedAnswers.map((answer, index) =>
                        index === answerIndex ? value : answer
                    )
                }
            })
        )
    }

    const removeWordRow = async (clientId: string) => {
        const word = words.find(word => word.clientId === clientId)
        if (!word) return

        setSelectedPresetId(null)

        if (word.id) {
            await deleteWord(word.id)
        }

        setWords(currentWords => currentWords.filter(word => word.clientId !== clientId))

        setExpandedRows(currentRows => {
            const { [clientId]: _removedRow, ...remainingRows } = currentRows
            return remainingRows
        })
    }

    const updateDeckName = (value: string) => {
        setSelectedPresetId(null)
        setDeckName(value)
    }

    const updateDescription = (value: string) => {
        setSelectedPresetId(null)
        setDescription(value)
    }

    const updateLanguage = (value: string) => {
        setSelectedPresetId(null)
        setLanguage(value)
    }

    const updateTranslationLanguage = (value: string) => {
        setSelectedPresetId(null)
        setTranslationLanguage(value)
    }

    const applyPreset = (preset: SpanishDeckPreset) => {
        setSelectedPresetId(preset.id)
        setDeckName(preset.name)
        setDescription(preset.description)
        setLanguage("es")
        setTranslationLanguage("no")
        setLearningLanguageSide("source")
        setExpandedRows({})
        setWords(preset.words.map(word => ({
            clientId: createClientId(),
            original: word.original,
            translation: word.translation,
            acceptedOriginals: word.acceptedOriginals ?? [],
            acceptedAnswers: [],
            hint: ""
        })))
    }

    const resetDeckDraft = () => {
        setSelectedPresetId(null)
        setDeckName("")
        setDescription("")
        setLanguage("")
        setTranslationLanguage("no")
        setLearningLanguageSide("target")
        setExpandedRows({})
        setWords([createEmptyWordPair()])
    }

    const handleSubmit = async () => {
        if (!deckName || !language) return

        const learningLanguage = learningLanguageSide === "source" ? language : translationLanguage

        if (isEditing) {
            await updateDeck(Number(id), deckName, language, translationLanguage, learningLanguage, description)

            await Promise.all(words.map(word => {
                if (!word.original || !word.translation) return

                const alternativeTranslation = serializeAcceptedAnswers(word.acceptedAnswers)
                const alternativeOriginal = serializeAcceptedAnswers(word.acceptedOriginals)

                if (word.id) {
                    return updateWord(word.id, word.original, word.translation, word.hint || null, Number(id), alternativeTranslation, alternativeOriginal)
                }

                return addWord(word.original, word.translation, word.hint || null, Number(id), alternativeTranslation, alternativeOriginal)
            }))
        }
        else {
            const deck = await createDeck(deckName, language, translationLanguage, learningLanguage, description)
            const validWords = words.filter(word => word.original && word.translation)

            await Promise.all(validWords.map(word =>
                addWord(
                    word.original,
                    word.translation,
                    word.hint || null,
                    deck.id,
                    serializeAcceptedAnswers(word.acceptedAnswers),
                    serializeAcceptedAnswers(word.acceptedOriginals)
                )
            ))
        }

        navigate("/")
    }

    const inputClass = `w-full min-w-0 rounded-lg border-2 ${palette.border} ${textTone.panelClass} ${palette.glow} px-4 py-3 text-sm font-semibold ${textTone.inputClass} ${textTone.placeholderClass} outline-none backdrop-blur transition focus:-translate-y-0.5 focus:bg-white/15 focus:ring-2 focus:ring-white/20`
    const framedWordInputClass = `w-full min-w-0 rounded-[inherit] border-0 bg-transparent px-4 py-4 text-sm font-semibold ${textTone.inputClass} ${textTone.placeholderClass} outline-none transition focus:bg-white/10`
    const rowButtonClass = `grid h-11 w-11 shrink-0 place-items-center rounded-lg border-2 ${palette.border} bg-black/25 ${palette.glow} text-white/80 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white`
    const deleteButtonClass = "grid h-11 w-11 shrink-0 place-items-center rounded-lg border-2 border-red-300/40 bg-black/25 text-red-300 backdrop-blur transition hover:-translate-y-0.5 hover:bg-red-500/20 hover:text-red-100"
    const addWordClass = `mb-6 w-full rounded-2xl border-2 border-dashed ${palette.border} py-3 text-sm text-white/70 transition hover:text-white`
    const presetCardClass = `rounded-lg border p-4 text-left transition hover:-translate-y-0.5`

    return (
        <PageContentTransition>
            <AppPageShell contentClassName="max-w-[82rem]">
                <div className="mx-auto w-full max-w-2xl">
                    <FadeIn>
                        <button
                            onClick={() => navigate("/decks")}
                            className="mb-8 text-sm font-semibold text-white/70 transition hover:text-white"
                        >
                            Back to decks
                        </button>
                    </FadeIn>

                    <FadeIn>
                        <h1 className={`mb-8 text-3xl font-bold ${palette.accentText}`}>
                            {isEditing ? "Edit Deck" : "Create Deck"}
                        </h1>
                    </FadeIn>

                    {!isEditing && (
                        <FadeIn className="mb-6">
                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                                <button
                                    type="button"
                                    onClick={() => setShowPresets(current => !current)}
                                    className={`flex min-w-0 items-center justify-between rounded-2xl border-2 ${palette.border} bg-black/25 px-5 py-4 text-left text-white/85 ${palette.glow} backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white`}
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${palette.primaryButton} ${palette.primaryButtonText}`}>
                                            <Library size={19} strokeWidth={2.3} />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-base font-black">Preset decks</span>
                                            <span className="block truncate text-sm text-white/60">
                                                {selectedPresetId
                                                    ? spanishDeckPresets.find(preset => preset.id === selectedPresetId)?.name
                                                    : "Optional Spanish starter decks"}
                                            </span>
                                        </span>
                                    </span>
                                    <ChevronDown
                                        size={22}
                                        className={`shrink-0 transition ${showPresets ? "rotate-180" : ""}`}
                                    />
                                </button>

                                <button
                                    type="button"
                                    onClick={resetDeckDraft}
                                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 ${palette.border} bg-black/20 px-5 py-4 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white sm:min-w-40`}
                                >
                                    <RotateCcw size={17} strokeWidth={2.4} />
                                    Reset deck
                                </button>
                            </div>

                            {showPresets && (
                                <GradientFrame
                                    glow
                                    radius={16}
                                    radiusClass="mt-3 rounded-2xl"
                                    contentClassName="rounded-[inherit] p-5"
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {spanishDeckPresets.map(preset => {
                                            const isSelected = selectedPresetId === preset.id

                                            return (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    onClick={() => applyPreset(preset)}
                                                    className={`${presetCardClass} ${
                                                        isSelected
                                                            ? `${palette.primaryButton} ${palette.primaryButtonText} border-transparent shadow-lg`
                                                            : `${palette.border} bg-black/20 text-white/75 hover:bg-white/10 hover:text-white`
                                                    }`}
                                                >
                                                    <span className="block text-base font-black">{preset.name}</span>
                                                    <span className="mt-2 block text-sm leading-5 opacity-80">{preset.description}</span>
                                                    <span className="mt-3 block text-xs font-bold uppercase tracking-[0.14em] opacity-70">
                                                        {preset.words.length} words
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </GradientFrame>
                            )}
                        </FadeIn>
                    )}

                    <FadeIn className="mb-6 flex flex-col gap-4">
                        <div>
                            <label className="mb-1 block text-sm text-white/70">Deck name</label>
                            <input
                                type="text"
                                placeholder="E.g. Spanish basics"
                                value={deckName}
                                onChange={event => updateDeckName(event.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm text-white/70">Description (optional)</label>
                            <input
                                type="text"
                                placeholder="E.g. Common words for beginners"
                                value={description}
                                onChange={event => updateDescription(event.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </FadeIn>

                    <FadeIn className="relative z-[100] mb-4 grid grid-cols-2 gap-4 px-1">
                        <div className="space-y-2">
                            <LearningLanguageToggle
                                active={learningLanguageSide === "source"}
                                onClick={() => {
                                    setSelectedPresetId(null)
                                    setLearningLanguageSide("source")
                                }}
                            />
                            <LanguageSelect
                                value={language}
                                onChange={updateLanguage}
                                inputClassName={textTone.inputClass}
                                panelClassName={textTone.panelClass}
                            />
                        </div>

                        <div className="space-y-2">
                            <LearningLanguageToggle
                                active={learningLanguageSide === "target"}
                                onClick={() => {
                                    setSelectedPresetId(null)
                                    setLearningLanguageSide("target")
                                }}
                            />
                            <LanguageSelect
                                value={translationLanguage}
                                onChange={updateTranslationLanguage}
                                inputClassName={textTone.inputClass}
                                panelClassName={textTone.panelClass}
                            />
                        </div>
                    </FadeIn>
                </div>

                <div className="relative z-0 mb-6 flex flex-col gap-3">
                    {words.map(word => {
                        const isExpanded = !!expandedRows[word.clientId]
                        const acceptedAnswer = getAcceptedAnswersForSide(word, learningLanguageSide)[0] ?? ""

                        return (
                            <FadeIn key={word.clientId} className="w-full">
                                <div className="relative mx-auto w-full max-w-2xl">
                                    <div className="grid grid-cols-2 gap-3">
                                        <GradientFrame radius={8} radiusClass="rounded-lg" className="w-full" contentClassName="rounded-[inherit]">
                                            <input
                                                type="text"
                                                placeholder="E.g. hola"
                                                value={word.original}
                                                onChange={event => updateWordRow(word.clientId, "original", event.target.value)}
                                                className={framedWordInputClass}
                                            />
                                        </GradientFrame>

                                        <GradientFrame radius={8} radiusClass="rounded-lg" className="w-full" contentClassName="rounded-[inherit]">
                                            <input
                                                type="text"
                                                placeholder="E.g. hello"
                                                value={word.translation}
                                                onChange={event => updateWordRow(word.clientId, "translation", event.target.value)}
                                                className={framedWordInputClass}
                                            />
                                        </GradientFrame>
                                    </div>

                                    {isExpanded && (
                                        <div className="absolute left-full top-0 ml-3 w-72">
                                            <GradientFrame radius={8} radiusClass="rounded-lg" className="w-full" contentClassName="rounded-[inherit]">
                                                <input
                                                    type="text"
                                                    placeholder="Accepted answer"
                                                    value={acceptedAnswer}
                                                    onChange={event => updateAcceptedAnswer(word.clientId, 0, event.target.value)}
                                                    className={framedWordInputClass}
                                                />
                                            </GradientFrame>
                                        </div>
                                    )}

                                    <div
                                        className={`absolute top-0 flex gap-3 ${isExpanded ? "left-[calc(100%_+_19.5rem)]" : "left-[calc(100%_+_0.75rem)]"}`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleAcceptedAnswers(word.clientId)}
                                            aria-label="Toggle accepted answer"
                                            className={rowButtonClass}
                                        >
                                            <ChevronDown
                                                size={18}
                                                className={`transition ${isExpanded ? "rotate-90" : "-rotate-90"}`}
                                            />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => removeWordRow(word.clientId)}
                                            aria-label="Remove word"
                                            className={deleteButtonClass}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </FadeIn>
                        )
                    })}
                </div>

                <FadeIn className="relative z-0 mx-auto w-full max-w-2xl">
                    <button
                        onClick={addWordRow}
                        className={addWordClass}
                    >
                        + Add word
                    </button>
                </FadeIn>

                <FadeIn className="relative z-0 mx-auto w-full max-w-2xl">
                    <button
                        onClick={handleSubmit}
                        disabled={!deckName || !language}
                        className={`w-full rounded-full py-3 font-semibold ${palette.primaryButtonText} transition disabled:opacity-50 ${palette.primaryButton}`}
                    >
                        {isEditing ? "Save changes" : "Create deck"}
                    </button>
                </FadeIn>
            </AppPageShell>
        </PageContentTransition>
    )
}

function LearningLanguageToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
    const { palette } = useTheme()

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                active
                    ? `${palette.primaryButton} ${palette.primaryButtonText} border-transparent shadow-lg`
                    : `${palette.border} bg-black/20 text-white/70 hover:text-white`
            }`}
        >
            <span className={`grid h-5 w-5 place-items-center rounded-full border ${
                active ? "border-white bg-white/20" : "border-white/50"
            }`}>
                {active && <Check size={14} strokeWidth={3} />}
            </span>
            Learning language
        </button>
    )
}
