import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Check, ChevronDown, Library, RotateCcw, X } from "lucide-react"

import { createDeck, getDeck, isDeckTrialPassed, updateDeckContent, type Deck, type UpdateDeckContentInput } from "../api/decks"
import { addWord } from "../api/words"
import FadeIn from "../components/FadeIn"
import GradientFrame from "../components/GradientFrame"
import LanguageSelect from "../components/LanguageSelect"
import AppPageShell from "../components/layout/AppPageShell"
import PageContentTransition from "../components/PageContentTransition"
import { spanishDeckPresets, type SpanishDeckPreset } from "../data/spanishDeckPresets"
import { useTheme } from "../theme/ThemeContext"
import TrialResetWarningModal from "../components/decks/TrialResetWarningModal"
import { hasTrialRelevantDeckChanges } from "../utils/deckTrialChanges"

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
    const [originalDeck, setOriginalDeck] = useState<Deck | null>(null)
    const [showTrialResetWarning, setShowTrialResetWarning] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState("")
    const hasCompleteWordPair = words.some(word => word.original.trim() && word.translation.trim())

    useEffect(() => {
        if (!isEditing) return

        getDeck(Number(id)).then(deck => {
            setOriginalDeck(deck)
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

    const removeWordRow = (clientId: string) => {
        const word = words.find(word => word.clientId === clientId)
        if (!word) return

        setSelectedPresetId(null)

        setWords(currentWords => currentWords.filter(word => word.clientId !== clientId))

        setExpandedRows(currentRows => {
            const remainingRows = { ...currentRows }
            delete remainingRows[clientId]
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

    const createContentInput = (): UpdateDeckContentInput => {
        const learningLanguage = learningLanguageSide === "source" ? language : translationLanguage
        const validWords = words.filter(word => word.original.trim() && word.translation.trim())

        return {
            name: deckName.trim(),
            language,
            translationLanguage,
            learningLanguage,
            description: description.trim(),
            words: validWords.map(word => ({
                id: word.id,
                original: word.original,
                translation: word.translation,
                alternativeOriginal: serializeAcceptedAnswers(word.acceptedOriginals),
                alternativeTranslation: serializeAcceptedAnswers(word.acceptedAnswers),
                hint: word.hint.trim() || null
            }))
        }
    }

    const saveDeck = async (content: UpdateDeckContentInput) => {
        setIsSaving(true)
        setSaveError("")

        try {
            if (isEditing) {
                await updateDeckContent(Number(id), content)
            } else {
                const deck = await createDeck(content.name, content.language, content.translationLanguage, content.learningLanguage, content.description)
                await Promise.all(content.words.map(word =>
                    addWord(
                        word.original,
                        word.translation,
                        word.hint,
                        deck.id,
                        word.alternativeTranslation,
                        word.alternativeOriginal
                    )
                ))
            }

            navigate("/decks")
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : "Could not save deck")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSubmit = () => {
        if (!deckName || !language) return

        const content = createContentInput()
        if (!isEditing && content.words.length === 0) return

        if (isEditing && originalDeck && isDeckTrialPassed(originalDeck) && hasTrialRelevantDeckChanges(originalDeck, content)) {
            setShowTrialResetWarning(true)
            return
        }

        void saveDeck(content)
    }

    const framedWordInputClass = `w-full min-w-0 scroll-mt-20 scroll-mb-32 rounded-[inherit] border-0 bg-transparent px-4 py-3 text-sm font-semibold ${textTone.inputClass} ${textTone.placeholderClass} outline-none transition focus:bg-white/10 sm:py-4`
    const rowButtonClass = `grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 ${palette.border} bg-black/25 ${palette.glow} text-white/80 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white sm:h-11 sm:w-11`
    const deleteButtonClass = "grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-red-300/40 bg-black/25 text-red-300 backdrop-blur transition hover:-translate-y-0.5 hover:bg-red-500/20 hover:text-red-100 sm:h-11 sm:w-11"
    const addWordClass = `mb-6 w-full rounded-2xl border-2 border-dashed ${palette.border} py-3 text-sm text-white/70 transition hover:text-white`
    const presetCardClass = `rounded-lg border p-4 text-left transition hover:-translate-y-0.5`

    return (
        <>
        <TrialResetWarningModal
            isOpen={showTrialResetWarning}
            isSaving={isSaving}
            onCancel={() => setShowTrialResetWarning(false)}
            onConfirm={() => {
                setShowTrialResetWarning(false)
                void saveDeck(createContentInput())
            }}
        />
        <PageContentTransition>
            <AppPageShell contentClassName="max-w-[82rem] pb-4 sm:pb-8">
                <div className="mx-auto w-full max-w-2xl">
                    <FadeIn>
                        <h1 className={`mb-4 text-2xl font-bold sm:mb-8 sm:text-3xl ${palette.accentText}`}>
                            {isEditing ? "Edit Deck" : "Create Deck"}
                        </h1>
                    </FadeIn>

                    {!isEditing && (
                        <FadeIn className="mb-4 sm:mb-6">
                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                                <button
                                    type="button"
                                    onClick={() => setShowPresets(current => !current)}
                                    className={`flex min-w-0 items-center justify-between rounded-2xl border-2 ${palette.border} bg-black/25 px-4 py-3 text-left text-white/85 ${palette.glow} backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white sm:px-5 sm:py-4`}
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
                                    className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl border-2 ${palette.border} bg-black/20 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white sm:min-w-40 sm:py-4`}
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
                                    contentClassName="rounded-[inherit] p-3 sm:p-5"
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

                    <FadeIn className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4">
                        <div>
                            <label className="mb-1 block text-sm text-white/70">Deck name</label>
                            <GradientFrame glass radius={8} radiusClass="rounded-lg" className="w-full" contentClassName="rounded-[inherit]">
                                <input
                                    type="text"
                                    placeholder="E.g. Spanish basics"
                                    value={deckName}
                                    onChange={event => updateDeckName(event.target.value)}
                                    className={framedWordInputClass}
                                />
                            </GradientFrame>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm text-white/70">Description (optional)</label>
                            <GradientFrame glass radius={8} radiusClass="rounded-lg" className="w-full" contentClassName="rounded-[inherit]">
                                <input
                                    type="text"
                                    placeholder="E.g. Common words for beginners"
                                    value={description}
                                    onChange={event => updateDescription(event.target.value)}
                                    className={framedWordInputClass}
                                />
                            </GradientFrame>
                        </div>
                    </FadeIn>

                    <FadeIn className="relative z-[100] mb-4 grid grid-cols-1 gap-3 px-1 sm:grid-cols-2 sm:gap-4">
                        <div className="space-y-1.5 sm:space-y-2">
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

                        <div className="space-y-1.5 sm:space-y-2">
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

                <div className="relative z-0 mb-4 flex flex-col gap-2 sm:mb-6 sm:gap-3">
                    {words.map(word => {
                        const isExpanded = !!expandedRows[word.clientId]
                        const acceptedAnswer = getAcceptedAnswersForSide(word, learningLanguageSide)[0] ?? ""

                        return (
                            <FadeIn key={word.clientId} className="w-full">
                                <div className="relative mx-auto grid w-full max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:block">
                                    <div className="min-w-0">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                                        <GradientFrame glass radius={8} radiusClass="rounded-lg" className="w-full" contentClassName="rounded-[inherit]">
                                            <input
                                                type="text"
                                                placeholder="E.g. hola"
                                                value={word.original}
                                                onChange={event => updateWordRow(word.clientId, "original", event.target.value)}
                                                className={framedWordInputClass}
                                            />
                                        </GradientFrame>

                                        <GradientFrame glass radius={8} radiusClass="rounded-lg" className="w-full" contentClassName="rounded-[inherit]">
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
                                        <div className="mt-2 w-full sm:mt-3 xl:absolute xl:left-full xl:top-0 xl:mt-0 xl:ml-3 xl:w-72">
                                            <GradientFrame glass radius={8} radiusClass="rounded-lg" className="w-full" contentClassName="rounded-[inherit]">
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
                                    </div>

                                    <div
                                        className={`flex flex-col gap-2 sm:mt-3 sm:flex-row sm:justify-end sm:gap-3 xl:absolute xl:top-0 xl:mt-0 xl:justify-start ${isExpanded ? "xl:left-[calc(100%_+_19.5rem)]" : "xl:left-[calc(100%_+_0.75rem)]"}`}
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

                <FadeIn className="relative z-0 mx-auto w-full max-w-2xl scroll-mb-32">
                    <button
                        onClick={addWordRow}
                        className={addWordClass}
                    >
                        + Add word
                    </button>
                </FadeIn>

                <FadeIn className="relative z-0 mx-auto w-full max-w-2xl scroll-mb-32">
                    {!isEditing && !hasCompleteWordPair && (
                        <p className="mb-3 text-center text-sm font-semibold text-white/62">
                            Add at least one complete word pair to create the deck.
                        </p>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || !deckName.trim() || !language || (!isEditing && !hasCompleteWordPair)}
                        className={`min-h-12 w-full rounded-full py-3 font-semibold ${palette.primaryButtonText} transition disabled:opacity-50 ${palette.primaryButton}`}
                    >
                        {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create deck"}
                    </button>
                    {saveError && <p className="mt-3 text-center text-sm font-bold text-red-300">{saveError}</p>}
                </FadeIn>
            </AppPageShell>
        </PageContentTransition>
        </>
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
