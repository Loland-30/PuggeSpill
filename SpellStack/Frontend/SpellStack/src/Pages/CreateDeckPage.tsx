import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Check, ChevronDown, X } from "lucide-react"

import { createDeck, getDeck, updateDeck } from "../api/decks"
import { addWord, deleteWord, updateWord } from "../api/words"
import FadeIn from "../components/FadeIn"
import LanguageSelect from "../components/LanguageSelect"
import PageContentTransition from "../components/PageContentTransition"
import { useTheme } from "../theme/ThemeContext"

interface WordPair {
    clientId: string
    id?: number
    original: string
    translation: string
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

export default function CreateDeckPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditing = !!id
    const { theme, palette, textTone } = useTheme()

    const [deckName, setDeckName] = useState("")
    const [translationLanguage, setTranslationLanguage] = useState("no")
    const [language, setLanguage] = useState("")
    const [learningLanguageSide, setLearningLanguageSide] = useState<LearningLanguageSide>("target")
    const [description, setDescription] = useState("")
    const [words, setWords] = useState<WordPair[]>(() => [createEmptyWordPair()])
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

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
                acceptedAnswers: splitAcceptedAnswers(word.alternativeTranslation),
                hint: word.hint ?? ""
            })))
        })
    }, [id, isEditing])

    const addWordRow = () => {
        setWords(currentWords => [...currentWords, createEmptyWordPair()])
    }

    const updateWordRow = (clientId: string, field: WordEditableField, value: string) => {
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
                currentWords.map(word =>
                    word.clientId === clientId && word.acceptedAnswers.length === 0
                        ? { ...word, acceptedAnswers: [""] }
                        : word
                )
            )
        }

        setExpandedRows(currentRows => ({
            ...currentRows,
            [clientId]: !currentRows[clientId]
        }))
    }

    const updateAcceptedAnswer = (clientId: string, answerIndex: number, value: string) => {
        setWords(currentWords =>
            currentWords.map(word =>
                word.clientId === clientId
                    ? {
                        ...word,
                        acceptedAnswers: word.acceptedAnswers.map((answer, index) =>
                            index === answerIndex ? value : answer
                        )
                    }
                    : word
            )
        )
    }

    const removeWordRow = async (clientId: string) => {
        const word = words.find(word => word.clientId === clientId)
        if (!word) return

        if (word.id) {
            await deleteWord(word.id)
        }

        setWords(currentWords => currentWords.filter(word => word.clientId !== clientId))

        setExpandedRows(currentRows => {
            const { [clientId]: _removedRow, ...remainingRows } = currentRows
            return remainingRows
        })
    }

    const handleSubmit = async () => {
        if (!deckName || !language) return

        const learningLanguage = learningLanguageSide === "source" ? language : translationLanguage

        if (isEditing) {
            await updateDeck(Number(id), deckName, language, translationLanguage, learningLanguage, description)

            await Promise.all(words.map(word => {
                if (!word.original || !word.translation) return

                const alternativeTranslation = serializeAcceptedAnswers(word.acceptedAnswers)

                if (word.id) {
                    return updateWord(word.id, word.original, word.translation, word.hint || null, Number(id), alternativeTranslation)
                }

                return addWord(word.original, word.translation, word.hint || null, Number(id), alternativeTranslation)
            }))
        }
        else {
            const deck = await createDeck(deckName, language, translationLanguage, learningLanguage, description)
            const validWords = words.filter(word => word.original && word.translation)

            await Promise.all(validWords.map(word =>
                addWord(word.original, word.translation, word.hint || null, deck.id, serializeAcceptedAnswers(word.acceptedAnswers))
            ))
        }

        navigate("/")
    }

    const isRedPurple = theme.paletteId === "purpleGradient"
    const redPurpleGlass = "border-fuchsia-400/80 bg-slate-950/45 shadow-[0_0_14px_rgba(217,70,239,0.14)] backdrop-blur-xl"
    const inputClass = isRedPurple
        ? `w-full min-w-0 rounded-lg border-2 ${redPurpleGlass} px-4 py-3 text-sm font-semibold ${textTone.inputClass} ${textTone.placeholderClass} outline-none transition focus:-translate-y-0.5 focus:border-rose-400 focus:bg-white/10`
        : `w-full min-w-0 rounded-lg border-2 ${palette.border} ${textTone.panelClass} ${palette.glow} px-4 py-3 text-sm font-semibold ${textTone.inputClass} ${textTone.placeholderClass} outline-none backdrop-blur transition focus:-translate-y-0.5 focus:bg-white/15 focus:ring-2 focus:ring-white/20`
    const cardClass = isRedPurple
        ? `mb-6 rounded-lg border-2 ${redPurpleGlass} p-6`
        : `${palette.card} mb-6 rounded-lg border ${palette.border} ${palette.glow} p-6`
    const rowButtonClass = isRedPurple
        ? `grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white shadow-[0_0_12px_rgba(217,70,239,0.14)] transition hover:-translate-y-0.5 ${palette.primaryButton}`
        : `grid h-11 w-11 shrink-0 place-items-center rounded-lg border-2 ${palette.border} bg-black/25 ${palette.glow} text-white/80 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white`
    const deleteButtonClass = isRedPurple
        ? "grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-red-300/45 bg-red-950/35 text-red-200 shadow-[0_0_10px_rgba(248,113,113,0.12)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-red-500/25 hover:text-red-100"
        : "grid h-11 w-11 shrink-0 place-items-center rounded-lg border-2 border-red-300/40 bg-black/25 text-red-300 backdrop-blur transition hover:-translate-y-0.5 hover:bg-red-500/20 hover:text-red-100"
    const addWordClass = isRedPurple
        ? "mb-6 w-full rounded-2xl border-2 border-dashed border-fuchsia-400/90 bg-slate-950/20 py-3 text-sm text-white/80 shadow-[0_0_10px_rgba(217,70,239,0.1)] backdrop-blur transition hover:bg-white/10 hover:text-white"
        : `mb-6 w-full rounded-2xl border-2 border-dashed ${palette.border} py-3 text-sm text-white/70 transition hover:text-white`

    return (
        <PageContentTransition>
            <div className="relative z-10 mx-auto w-full max-w-[82rem] px-4">
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

                    <FadeIn className={cardClass}>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="mb-1 block text-sm text-white/70">Deck name</label>
                                <input
                                    type="text"
                                    placeholder="E.g. Spanish basics"
                                    value={deckName}
                                    onChange={event => setDeckName(event.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-white/70">Description (optional)</label>
                                <input
                                    type="text"
                                    placeholder="E.g. Common words for beginners"
                                    value={description}
                                    onChange={event => setDescription(event.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn className="relative z-[100] mb-4 grid grid-cols-2 gap-4 px-1">
                        <div className="space-y-2">
                            <LearningLanguageToggle
                                active={learningLanguageSide === "source"}
                                onClick={() => setLearningLanguageSide("source")}
                            />
                            <LanguageSelect
                                value={language}
                                onChange={setLanguage}
                                inputClassName={textTone.inputClass}
                                panelClassName={isRedPurple ? "border-transparent shadow-[0_0_14px_rgba(217,70,239,0.14)] backdrop-blur-xl" : textTone.panelClass}
                            />
                        </div>

                        <div className="space-y-2">
                            <LearningLanguageToggle
                                active={learningLanguageSide === "target"}
                                onClick={() => setLearningLanguageSide("target")}
                            />
                            <LanguageSelect
                                value={translationLanguage}
                                onChange={setTranslationLanguage}
                                inputClassName={textTone.inputClass}
                                panelClassName={isRedPurple ? "border-transparent shadow-[0_0_14px_rgba(217,70,239,0.14)] backdrop-blur-xl" : textTone.panelClass}
                            />
                        </div>
                    </FadeIn>
                </div>

                <div className="relative z-0 mb-6 flex flex-col gap-3">
                    {words.map(word => {
                        const isExpanded = !!expandedRows[word.clientId]
                        const acceptedAnswer = word.acceptedAnswers[0] ?? ""

                        return (
                            <FadeIn key={word.clientId} className="w-full">
                                <div className="relative mx-auto w-full max-w-2xl">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="E.g. hola"
                                            value={word.original}
                                            onChange={event => updateWordRow(word.clientId, "original", event.target.value)}
                                            className={inputClass}
                                        />

                                        <input
                                            type="text"
                                            placeholder="E.g. hello"
                                            value={word.translation}
                                            onChange={event => updateWordRow(word.clientId, "translation", event.target.value)}
                                            className={inputClass}
                                        />
                                    </div>

                                    {isExpanded && (
                                        <div className="absolute left-full top-0 ml-3 w-72">
                                            <input
                                                type="text"
                                                placeholder="Accepted answer"
                                                value={acceptedAnswer}
                                                onChange={event => updateAcceptedAnswer(word.clientId, 0, event.target.value)}
                                                className={inputClass}
                                            />
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
                        className={`w-full rounded-full py-3 font-semibold text-white transition disabled:opacity-50 ${palette.primaryButton}`}
                    >
                        {isEditing ? "Save changes" : "Create deck"}
                    </button>
                </FadeIn>
            </div>
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
                    ? `${palette.primaryButton} border-transparent text-white shadow-lg`
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









