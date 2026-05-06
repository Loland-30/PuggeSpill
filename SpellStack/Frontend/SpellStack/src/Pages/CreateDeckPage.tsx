import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Check } from "lucide-react"

import { createDeck, getDeck, updateDeck } from "../api/decks"
import { addWord, updateWord, deleteWord } from "../api/words"
import FadeIn from "../components/FadeIn"
import LanguageSelect from "../components/LanguageSelect"
import { useTheme } from "../theme/ThemeContext"
import PageContentTransition from "../components/PageContentTransition"

interface WordPair {
    id?: number
    original: string
    translation: string
    hint: string
}

type LearningLanguageSide = "source" | "target"

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
    const [words, setWords] = useState<WordPair[]>([
        { original: "", translation: "", hint: "" }
    ])

    useEffect(() => {
        if (isEditing) {
            getDeck(Number(id)).then(deck => {
                setDeckName(deck.name)
                setLanguage(deck.language)
                setTranslationLanguage(deck.translationLanguage)
                setLearningLanguageSide(deck.learningLanguage === deck.language ? "source" : "target")
                setDescription(deck.description)
                setWords(deck.words.map(w => ({
                    id: w.id,
                    original: w.original,
                    translation: w.translation,
                    hint: w.hint ?? ""
                })))
            })
        }
    }, [])

    const addWordRow = () => {
        setWords([...words, { original: "", translation: "", hint: "" }])
    }

    const updateWordRow = (index: number, field: keyof WordPair, value: string) => {
        const updated = [...words]
        updated[index] = { ...updated[index], [field]: value }
        setWords(updated)
    }

    const removeWordRow = async (index: number) => {
        const word = words[index]
        if (word.id) await deleteWord(word.id)
        setWords(words.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!deckName || !language) return
        const learningLanguage = learningLanguageSide === "source" ? language : translationLanguage

        if (isEditing) {
            await updateDeck(Number(id), deckName, language, translationLanguage, learningLanguage, description)
            await Promise.all(words.map(w => {
                if (!w.original || !w.translation) return
                if (w.id) return updateWord(w.id, w.original, w.translation, w.hint || null, Number(id))
                else return addWord(w.original, w.translation, w.hint || null, Number(id))
            }))
        } else {
            const deck = await createDeck(deckName, language, translationLanguage, learningLanguage, description)
            const validWords = words.filter(w => w.original && w.translation)
            await Promise.all(validWords.map(w =>
                addWord(w.original, w.translation, w.hint || null, deck.id)
            ))
        }

        navigate("/")
    }

    const inputClass = `w-full border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 transition ${textTone.panelClass} ${textTone.inputClass} ${textTone.placeholderClass}`

    return (
        <PageContentTransition>
            <div className="relative z-10 mx-auto w-full max-w-[102rem]">
                <div className="max-w-2xl">
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

            <FadeIn className={`${palette.card} rounded-lg border ${palette.border} ${palette.glow} p-6 mb-6`}>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm text-white/70 mb-1 block">Deck name</label>
                        <input
                            type="text"
                            placeholder="E.g. Spanish basics"
                            value={deckName}
                            onChange={e => setDeckName(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-white/70 mb-1 block">Description (optional)</label>
                        <input
                            type="text"
                            placeholder="E.g. Common words for beginners"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>
            </FadeIn>

            {/* KOLONNEHEADER */}
            <FadeIn className="grid grid-cols-2 gap-4 mb-4 px-1">
                <div className="space-y-2">
                    <LearningLanguageToggle
                        active={learningLanguageSide === "source"}
                        onClick={() => setLearningLanguageSide("source")}
                    />
                    <LanguageSelect value={language} onChange={setLanguage} inputClassName={textTone.inputClass} panelClassName={textTone.panelClass} />
                </div>
                <div className="space-y-2">
                    <LearningLanguageToggle
                        active={learningLanguageSide === "target"}
                        onClick={() => setLearningLanguageSide("target")}
                    />
                    <LanguageSelect value={translationLanguage} onChange={setTranslationLanguage} inputClassName={textTone.inputClass} panelClassName={textTone.panelClass} />
                </div>
            </FadeIn>

            {/* ORD */}
            <div className="flex flex-col gap-3 mb-6">
                {words.map((word, index) => (
                    <FadeIn key={index} className="grid grid-cols-2 gap-4 items-center">
                        <input
                            type="text"
                            placeholder="E.g. hola"
                            value={word.original}
                            onChange={e => updateWordRow(index, "original", e.target.value)}
                            className={inputClass}
                        />
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                placeholder="E.g. hello"
                                value={word.translation}
                                onChange={e => updateWordRow(index, "translation", e.target.value)}
                                className={inputClass}
                            />
                            <button
                                onClick={() => removeWordRow(index)}
                                className="text-red-300 hover:text-red-200 text-sm shrink-0"
                            >
                                ✕
                            </button>
                        </div>
                    </FadeIn>
                ))}
            </div>

            <FadeIn>
            <button
                onClick={addWordRow}
                className={`w-full border-2 border-dashed ${palette.border} rounded-2xl py-3 text-sm text-white/70 hover:text-white transition mb-6`}
            >
                + Add word
            </button>
            </FadeIn>

            <FadeIn>
            <button
                onClick={handleSubmit}
                disabled={!deckName || !language}
                className={`w-full text-white rounded-full py-3 font-semibold transition disabled:opacity-50 ${palette.primaryButton}`}
            >
                {isEditing ? "Save changes" : "Create deck"}
            </button>
            </FadeIn>
                </div>
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
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${active ? `${palette.primaryButton} border-transparent text-white shadow-lg` : `${palette.border} bg-black/20 text-white/70 hover:text-white`}`}
        >
            <span className={`grid h-5 w-5 place-items-center rounded-full border ${active ? "border-white bg-white/20" : "border-white/50"}`}>
                {active && <Check size={14} strokeWidth={3} />}
            </span>
            Learning language
        </button>
    )
}
