import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Check, Edit3, Plus, Save, Trash2, X } from "lucide-react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"

import { createDeck } from "../api/decks"
import {
    getTranslationSuggestions,
    TranslationApiError,
    type TranslationRequestVariant,
    type TranslationSuggestion
} from "../api/translation"
import { addWord } from "../api/words"
import FadeIn from "../components/FadeIn"
import GradientFrame from "../components/GradientFrame"
import AppPageShell from "../components/layout/AppPageShell"
import LanguageSelect from "../components/LanguageSelect"
import PageContentTransition from "../components/PageContentTransition"
import { getLanguageName, languages } from "../data/languages"
import { useI18n } from "../i18n/I18nContext"
import { getAppLanguageLocale } from "../i18n/localeMap"
import { useTheme } from "../theme/ThemeContext"
import { readDeckCreatorSettings } from "../utils/deckCreatorSettings"
import { selectPrimaryJapaneseReading } from "../utils/japaneseReadings"
import ClassicCreateDeckPage from "./ClassicCreateDeckPage"

interface DraftWord {
    id: string
    source: string
    translation: string
    alternativeTranslation: string | null
}

function createDraftId() {
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function CreateDeckPage() {
    const useClassicCreator = useMemo(() => readDeckCreatorSettings().useClassicDeckCreator, [])
    if (useClassicCreator) return <ClassicCreateDeckPage />

    return <AssistedCreateDeckPage />
}

function AssistedCreateDeckPage() {
    const navigate = useNavigate()
    const { t } = useI18n()
    const { palette, textTone } = useTheme()
    const copy = t.createDeckAssistant
    const [sourceLanguage, setSourceLanguage] = useState("no")
    const [targetLanguage, setTargetLanguage] = useState("es")
    const [words, setWords] = useState<DraftWord[]>([])
    const [isWordOverlayOpen, setIsWordOverlayOpen] = useState(false)
    const [editingWordId, setEditingWordId] = useState<string | null>(null)
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
    const [deckName, setDeckName] = useState("")
    const [description, setDescription] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState("")
    const [partialDeckId, setPartialDeckId] = useState<number | null>(null)
    const addWordButtonRef = useRef<HTMLButtonElement>(null)
    const saveButtonRef = useRef<HTMLButtonElement>(null)

    const source = languages.find(language => language.code === sourceLanguage)
    const target = languages.find(language => language.code === targetLanguage)
    const languageError = sourceLanguage === targetLanguage ? copy.languagesMustDiffer : ""

    const openAddWord = () => {
        if (languageError) return
        setEditingWordId(null)
        setIsWordOverlayOpen(true)
    }

    const openEditWord = (wordId: string) => {
        setEditingWordId(wordId)
        setIsWordOverlayOpen(true)
    }

    const handleWordSave = (sourceText: string, selections: TranslationSuggestion[]) => {
        const cleanedSource = sourceText.trim()
        const uniqueSelections = deduplicateSuggestions(selections)
        if (!cleanedSource || uniqueSelections.length === 0) return

        const grammaticalForms = uniqueSelections.filter(suggestion =>
            suggestion.variant !== "default" ||
            (
                suggestion.number === "singular" &&
                (suggestion.gender === "masculine" || suggestion.gender === "feminine")
            )
        )
        const grammaticalFormTexts = new Set(grammaticalForms.map(suggestion => normalizeSuggestionText(suggestion.text)))
        const ordinarySuggestions = uniqueSelections.filter(suggestion =>
            !grammaticalFormTexts.has(normalizeSuggestionText(suggestion.text))
        )
        const nextWords: Omit<DraftWord, "id">[] = ordinarySuggestions.map(suggestion => ({
            source: cleanedSource,
            translation: suggestion.text,
            alternativeTranslation: null
        }))

        if (grammaticalForms.length >= 2) {
            nextWords.push({
                source: cleanedSource,
                translation: grammaticalForms[0].text,
                alternativeTranslation: grammaticalForms.slice(1).map(suggestion => suggestion.text).join(", ")
            })
        } else if (grammaticalForms.length === 1) {
            nextWords.push({
                source: cleanedSource,
                translation: grammaticalForms[0].text,
                alternativeTranslation: null
            })
        }

        if (editingWordId) {
            setWords(currentWords => currentWords.map(word =>
                word.id === editingWordId
                    ? { ...word, ...nextWords[0] }
                    : word
            ))
            setEditingWordId(null)
            return
        }

        setWords(currentWords => [
            ...currentWords,
            ...nextWords.map(word => ({
                id: createDraftId(),
                ...word
            }))
        ])
    }

    const handleSaveDeck = async (event: FormEvent) => {
        event.preventDefault()
        if (!deckName.trim()) {
            setSaveError(copy.deckNameRequired)
            return
        }
        if (words.length === 0) {
            setSaveError(copy.wordsRequired)
            return
        }
        if (languageError) {
            setSaveError(languageError)
            return
        }

        setIsSaving(true)
        setSaveError("")
        setPartialDeckId(null)

        try {
            const deck = await createDeck(
                deckName.trim(),
                sourceLanguage,
                targetLanguage,
                targetLanguage,
                description.trim()
            )

            const results = await Promise.allSettled(words.map(word =>
                addWord(word.source, word.translation, null, deck.id, word.alternativeTranslation)
            ))
            const failedWords = results.filter(result => result.status === "rejected")

            if (failedWords.length > 0) {
                setPartialDeckId(deck.id)
                setSaveError(copy.partialSaveFailed)
                return
            }

            navigate("/decks")
        } catch {
            setSaveError(copy.saveFailed)
        } finally {
            setIsSaving(false)
        }
    }

    const expandingButtonClass = `group relative flex h-12 w-12 shrink-0 items-center overflow-hidden rounded-full border-2 ${palette.border} bg-black/35 ${palette.glow} text-white shadow-xl transition-[width,background-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/10 focus-visible:w-36 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:hover:w-36`

    return (
        <>
            <PageContentTransition>
                <AppPageShell contentClassName="max-w-6xl pb-24 sm:pb-12">
                    <FadeIn className="mx-auto w-full max-w-4xl">
                        <div className="mb-8 flex items-start justify-between gap-4">
                            <h1 className={`text-3xl font-black sm:text-4xl ${palette.accentText}`}>{copy.title}</h1>
                            <div className="flex shrink-0 gap-3">
                                <button
                                    ref={addWordButtonRef}
                                    type="button"
                                    onClick={openAddWord}
                                    disabled={!!languageError}
                                    className={`${expandingButtonClass} disabled:cursor-not-allowed disabled:opacity-45`}
                                    aria-label={copy.addWord}
                                    title={copy.addWord}
                                >
                                    <span className="grid h-full w-12 shrink-0 place-items-center"><Plus size={22} /></span>
                                    <span className="whitespace-nowrap pr-4 text-sm font-black opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">{copy.addWord}</span>
                                </button>
                                <button
                                    ref={saveButtonRef}
                                    type="button"
                                    onClick={() => {
                                        setSaveError("")
                                        setIsSaveDialogOpen(true)
                                    }}
                                    disabled={words.length === 0 || !!languageError}
                                    className={`${expandingButtonClass} disabled:cursor-not-allowed disabled:opacity-45`}
                                    aria-label={copy.saveDeck}
                                    title={copy.saveDeck}
                                >
                                    <span className="grid h-full w-12 shrink-0 place-items-center"><Save size={20} /></span>
                                    <span className="whitespace-nowrap pr-4 text-sm font-black opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">{copy.saveDeck}</span>
                                </button>
                            </div>
                        </div>

                        <div className="relative z-30 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-white/70">{copy.knownLanguage}</label>
                                <LanguageSelect
                                    value={sourceLanguage}
                                    onChange={value => {
                                        setSourceLanguage(value)
                                        if (value === targetLanguage) {
                                            const replacement = languages.find(language => language.code !== value)
                                            if (replacement) setTargetLanguage(replacement.code)
                                        }
                                    }}
                                    placeholder={copy.chooseLanguage}
                                    inputClassName={textTone.inputClass}
                                    panelClassName={textTone.panelClass}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-white/70">{copy.learningLanguage}</label>
                                <LanguageSelect
                                    value={targetLanguage}
                                    onChange={value => {
                                        setTargetLanguage(value)
                                        if (value === sourceLanguage) {
                                            const replacement = languages.find(language => language.code !== value)
                                            if (replacement) setSourceLanguage(replacement.code)
                                        }
                                    }}
                                    placeholder={copy.chooseLanguage}
                                    inputClassName={textTone.inputClass}
                                    panelClassName={textTone.panelClass}
                                />
                            </div>
                        </div>
                        {languageError && <p className="mt-3 text-sm font-bold text-red-300">{languageError}</p>}

                        <div className="mt-10 space-y-3">
                            {words.length === 0 ? (
                                <div className="py-20 text-center">
                                    <p className="text-xl font-black text-white">{copy.emptyTitle}</p>
                                    <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-white/55">{copy.emptyDescription}</p>
                                </div>
                            ) : (
                                words.map(word => (
                                    <GradientFrame
                                        key={word.id}
                                        glass
                                        glow
                                        radius={14}
                                        radiusClass="rounded-2xl"
                                        contentClassName="rounded-[inherit] bg-black/30"
                                    >
                                        <div className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] sm:items-center sm:px-5">
                                            <LanguageValue flagUrl={source?.flagUrl} value={word.source} />
                                            <span className="hidden h-10 w-px bg-white/20 sm:block" aria-hidden="true" />
                                            <LanguageValue
                                                flagUrl={target?.flagUrl}
                                                value={word.alternativeTranslation
                                                    ? `${word.translation} / ${word.alternativeTranslation}`
                                                    : word.translation}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditWord(word.id)}
                                                    className="grid h-10 w-10 place-items-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                                    aria-label={copy.editWord}
                                                    title={copy.editWord}
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setWords(currentWords => currentWords.filter(item => item.id !== word.id))}
                                                    className="grid h-10 w-10 place-items-center rounded-full text-red-300/70 transition hover:bg-red-500/15 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                                                    aria-label={copy.deleteWord}
                                                    title={copy.deleteWord}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </GradientFrame>
                                ))
                            )}
                        </div>

                        <p className="mt-7 text-center text-sm font-bold text-white/60">
                            {copy.wordCount.replace("{count}", String(words.length))}
                        </p>
                    </FadeIn>
                </AppPageShell>
            </PageContentTransition>

            <AnimatePresence>
                {isWordOverlayOpen && (
                    <AddWordOverlay
                        sourceLanguage={sourceLanguage}
                        targetLanguage={targetLanguage}
                        initialWord={editingWordId ? words.find(word => word.id === editingWordId) ?? null : null}
                        onSave={handleWordSave}
                        onClose={() => {
                            setIsWordOverlayOpen(false)
                            setEditingWordId(null)
                            requestAnimationFrame(() => addWordButtonRef.current?.focus())
                        }}
                    />
                )}
            </AnimatePresence>

            {isSaveDialogOpen && (
                <SaveDeckDialog
                    deckName={deckName}
                    description={description}
                    isSaving={isSaving}
                    error={saveError}
                    partialDeckId={partialDeckId}
                    onDeckNameChange={setDeckName}
                    onDescriptionChange={setDescription}
                    onSubmit={handleSaveDeck}
                    onClose={() => {
                        if (isSaving) return
                        setIsSaveDialogOpen(false)
                        setSaveError("")
                        requestAnimationFrame(() => saveButtonRef.current?.focus())
                    }}
                    onOpenEditor={() => partialDeckId && navigate(`/decks/${partialDeckId}/edit`)}
                />
            )}
        </>
    )
}

function LanguageValue({ flagUrl, value }: { flagUrl?: string; value: string }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            {flagUrl && <img src={flagUrl} alt="" className="h-6 w-9 shrink-0 rounded-md object-cover shadow" />}
            <span className="min-w-0 break-words text-lg font-black text-white">{value}</span>
        </div>
    )
}

interface AddWordOverlayProps {
    sourceLanguage: string
    targetLanguage: string
    initialWord: DraftWord | null
    onSave: (source: string, suggestions: TranslationSuggestion[]) => void
    onClose: () => void
}

function normalizeSuggestionText(value: string) {
    return value.normalize("NFKC").trim().toLocaleLowerCase()
}

function deduplicateSuggestions(suggestions: TranslationSuggestion[]) {
    const unique = new Map<string, TranslationSuggestion>()
    for (const suggestion of suggestions) {
        const normalizedText = normalizeSuggestionText(suggestion.text)
        if (!normalizedText) continue

        const existing = unique.get(normalizedText)
        if (!existing) {
            unique.set(normalizedText, { ...suggestion, text: suggestion.text.trim() })
            continue
        }

        const preferSuggestion = existing.variant === "default" && suggestion.variant !== "default"
        const preferred = preferSuggestion ? suggestion : existing
        const fallback = preferSuggestion ? existing : suggestion
        unique.set(normalizedText, {
            ...preferred,
            text: preferred.text.trim(),
            partOfSpeech: preferred.partOfSpeech ?? fallback.partOfSpeech,
            gender: preferred.gender ?? fallback.gender,
            number: preferred.number ?? fallback.number,
            inferred: preferred.inferred ?? fallback.inferred,
            readings: preferred.readings?.length ? preferred.readings : fallback.readings
        })
    }
    return Array.from(unique.values())
}

function AddWordOverlay({ sourceLanguage, targetLanguage, initialWord, onSave, onClose }: AddWordOverlayProps) {
    const { t, appLanguage } = useI18n()
    const { palette, textTone } = useTheme()
    const prefersReducedMotion = useReducedMotion()
    const copy = t.createDeckAssistant
    const locale = getAppLanguageLocale(appLanguage)
    const initialSuggestions = useMemo<TranslationSuggestion[]>(() => {
        if (!initialWord) return []
        if (initialWord.alternativeTranslation) {
            return [
                { text: initialWord.translation, detectedSourceLanguage: null, variant: "masculine-singular" },
                { text: initialWord.alternativeTranslation, detectedSourceLanguage: null, variant: "feminine-singular" }
            ]
        }
        return [{ text: initialWord.translation, detectedSourceLanguage: null, variant: "default" }]
    }, [initialWord])
    const [sourceText, setSourceText] = useState(initialWord?.source ?? "")
    const [suggestions, setSuggestions] = useState<TranslationSuggestion[]>(initialSuggestions)
    const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(() =>
        new Set(initialSuggestions.map(suggestion => suggestion.text))
    )
    const [isLoading, setIsLoading] = useState(false)
    const [hasLookupCompleted, setHasLookupCompleted] = useState(initialSuggestions.length > 0)
    const [errorCode, setErrorCode] = useState<TranslationApiError["code"] | null>(null)
    const [isContextOpen, setIsContextOpen] = useState(false)
    const [contextText, setContextText] = useState("")
    const [activeContext, setActiveContext] = useState("")
    const [isManualOpen, setIsManualOpen] = useState(false)
    const [manualTranslation, setManualTranslation] = useState("")
    const [isLoadingForms, setIsLoadingForms] = useState(false)
    const [formsAttempted, setFormsAttempted] = useState(false)
    const [formsError, setFormsError] = useState(false)
    const overlayRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const requestRef = useRef(0)
    const abortRef = useRef<AbortController | null>(null)
    const formsAbortRef = useRef<AbortController | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const resetForNextWord = () => {
        setSourceText("")
        setSuggestions([])
        setSelectedSuggestions(new Set())
        setErrorCode(null)
        setIsLoading(false)
        setHasLookupCompleted(false)
        setIsContextOpen(false)
        setContextText("")
        setActiveContext("")
        setIsManualOpen(false)
        setManualTranslation("")
        setIsLoadingForms(false)
        setFormsAttempted(false)
        setFormsError(false)
        requestAnimationFrame(() => inputRef.current?.focus())
    }

    const loadSuggestions = useCallback(async (value: string, contextValue = "") => {
        const trimmedValue = value.trim()
        const trimmedContext = contextValue.trim()
        if (trimmedValue.length < 2 || trimmedValue.length > 100 || sourceLanguage === targetLanguage) {
            setSuggestions([])
            setIsLoading(false)
            return
        }

        const requestId = ++requestRef.current
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        setIsLoading(true)
        setHasLookupCompleted(false)
        setErrorCode(null)
        setFormsAttempted(false)
        setFormsError(false)

        try {
            const nextSuggestions = await getTranslationSuggestions(
                trimmedValue,
                sourceLanguage,
                targetLanguage,
                { context: trimmedContext, requestVariant: "default" },
                controller.signal
            )
            if (requestId !== requestRef.current) return
            setSuggestions(deduplicateSuggestions(nextSuggestions))
            setSelectedSuggestions(new Set())
            setActiveContext(trimmedContext)
        } catch (error) {
            if (controller.signal.aborted || requestId !== requestRef.current) return
            setSuggestions([])
            setErrorCode(error instanceof TranslationApiError ? error.code : "provider_unavailable")
        } finally {
            if (requestId === requestRef.current) {
                setIsLoading(false)
                setHasLookupCompleted(true)
            }
        }
    }, [
        sourceLanguage,
        targetLanguage,
        setActiveContext,
        setErrorCode,
        setFormsAttempted,
        setFormsError,
        setHasLookupCompleted,
        setIsLoading,
        setSelectedSuggestions,
        setSuggestions
    ])

    useEffect(() => {
        inputRef.current?.focus()
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault()
                onClose()
                return
            }
            if (event.key !== "Tab") return

            const focusableElements = Array.from(
                overlayRef.current?.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
                ) ?? []
            )
            if (focusableElements.length === 0) return
            const first = focusableElements[0]
            const last = focusableElements[focusableElements.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener("keydown", handleKeyDown)
            abortRef.current?.abort()
            formsAbortRef.current?.abort()
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [onClose])

    useEffect(() => {
        if (initialWord) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        const trimmedValue = sourceText.trim()
        if (trimmedValue.length < 2 || trimmedValue.length > 100) return

        debounceRef.current = setTimeout(() => void loadSuggestions(trimmedValue), 900)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [initialWord, loadSuggestions, sourceText])

    const submitImmediate = (event: ReactKeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter" || event.nativeEvent.isComposing) return
        event.preventDefault()
        if (debounceRef.current) clearTimeout(debounceRef.current)
        void loadSuggestions(sourceText)
    }

    const updateSourceText = (value: string) => {
        setSourceText(value)
        abortRef.current?.abort()
        formsAbortRef.current?.abort()
        setSuggestions([])
        setSelectedSuggestions(new Set())
        setIsLoading(false)
        setHasLookupCompleted(false)
        setErrorCode(null)
        setIsContextOpen(false)
        setContextText("")
        setActiveContext("")
        setIsManualOpen(false)
        setManualTranslation("")
        setIsLoadingForms(false)
        setFormsAttempted(false)
        setFormsError(false)
    }

    const addTranslations = (nextSuggestions: TranslationSuggestion[]) => {
        onSave(sourceText, nextSuggestions)
        if (initialWord) {
            onClose()
        } else {
            resetForNextWord()
        }
    }

    const submitContext = (event: FormEvent) => {
        event.preventDefault()
        const trimmedContext = contextText.trim()
        if (trimmedContext.length > 500) return
        void loadSuggestions(sourceText, trimmedContext)
    }

    const loadGrammaticalForms = async () => {
        if (isLoadingForms) return
        const controller = new AbortController()
        formsAbortRef.current?.abort()
        formsAbortRef.current = controller
        setIsLoadingForms(true)
        setFormsAttempted(true)
        setFormsError(false)

        const variants: TranslationRequestVariant[] = ["masculine-singular", "feminine-singular"]
        const results = await Promise.allSettled(variants.map(requestVariant =>
            getTranslationSuggestions(
                sourceText.trim(),
                sourceLanguage,
                targetLanguage,
                { context: activeContext, requestVariant },
                controller.signal
            )
        ))
        if (controller.signal.aborted) return

        const successfulForms = results
            .filter((result): result is PromiseFulfilledResult<TranslationSuggestion[]> => result.status === "fulfilled")
            .flatMap(result => result.value)
        setSuggestions(current => deduplicateSuggestions([...current, ...successfulForms]))
        setFormsError(results.some(result => result.status === "rejected"))
        setIsLoadingForms(false)
    }

    const validationMessage = sourceText.length > 0 && sourceText.trim().length < 2
        ? copy.sourceWordTooShort
        : sourceText.length > 100
            ? copy.sourceWordTooLong
            : ""

    const errorMessage = errorCode === "not_configured"
        ? copy.translationConfigurationError
        : errorCode === "rate_limited"
            ? copy.translationRateLimited
            : errorCode === "unsupported_language_pair"
                ? copy.unsupportedLanguagePair
            : errorCode
                ? copy.translationUnavailable
                : ""
    const showResults = isLoading ||
        hasLookupCompleted ||
        suggestions.length > 0 ||
        !!errorMessage ||
        isContextOpen ||
        isManualOpen ||
        isLoadingForms ||
        formsError
    const supportsGrammaticalForms = targetLanguage === "es" || targetLanguage === "es-419"
    const canShowManualEntry = !!errorMessage ||
        (hasLookupCompleted && suggestions.length === 0) ||
        isContextOpen ||
        formsError

    return createPortal(
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[300] overflow-y-auto text-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-word-title"
        >
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 bg-black/85"
                initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: prefersReducedMotion ? 1 : 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: "easeOut" }}
            />

            <button
                type="button"
                onClick={onClose}
                className={`fixed right-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-full border-2 ${palette.border} bg-black/50 ${palette.glow} transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-8 sm:top-8`}
                aria-label={copy.closeOverlay}
            >
                <X size={23} />
            </button>

            <div className={`relative z-10 mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 pb-16 ${showResults ? "pt-[10vh] sm:pt-[12vh]" : "pt-[19vh]"} motion-safe:transition-[padding] motion-safe:duration-300 sm:px-8`}>
                <FadeIn delayMs={0} durationMs={320}>
                    <h2 id="add-word-title" className="text-xl font-black sm:text-2xl">{copy.addWordTitle}</h2>
                    <p className="mt-2 text-sm font-semibold text-white/55">
                        {getLanguageName(sourceLanguage, locale)} → {getLanguageName(targetLanguage, locale)}
                    </p>
                </FadeIn>

                <FadeIn delayMs={80} durationMs={320}>
                    <GradientFrame glow radius={999} className="mt-5" radiusClass="rounded-full" contentClassName="rounded-[inherit]">
                        <input
                            ref={inputRef}
                            value={sourceText}
                            onChange={event => updateSourceText(event.target.value)}
                            onKeyDown={submitImmediate}
                            maxLength={101}
                            placeholder={copy.sourceWordPlaceholder}
                            className={`w-full rounded-full bg-transparent px-6 py-4 text-lg font-black outline-none sm:px-8 sm:py-5 ${textTone.inputClass} ${textTone.placeholderClass}`}
                            aria-describedby={validationMessage ? "source-word-validation" : undefined}
                        />
                    </GradientFrame>
                    {validationMessage && <p id="source-word-validation" className="mt-2 text-sm font-bold text-red-300">{validationMessage}</p>}
                </FadeIn>

                <AnimatePresence initial={false}>
                    {showResults && (
                        <motion.div
                            key="translation-results"
                            className="mt-8"
                            initial={{ opacity: prefersReducedMotion ? 1 : 0, height: prefersReducedMotion ? "auto" : 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: prefersReducedMotion ? 1 : 0, height: prefersReducedMotion ? "auto" : 0 }}
                            transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: "easeOut" }}
                        >
                            <h3 className="text-base font-black text-white/80">{copy.suggestionsTitle}</h3>
                            {isLoading && <p className="mt-4 text-sm font-semibold text-white/55" role="status" aria-live="polite">{copy.translating}</p>}
                            {!isLoading && hasLookupCompleted && !errorMessage && suggestions.length === 0 && (
                                <p className="mt-4 text-sm font-semibold text-white/55">{copy.noSuggestions}</p>
                            )}
                            {errorMessage && <p className="mt-4 text-sm font-bold text-amber-200" role="alert">{errorMessage}</p>}

                            <div className="mt-4 space-y-3">
                            {suggestions.map((suggestion, index) => {
                                const isSelected = selectedSuggestions.has(suggestion.text)
                                const primaryJapaneseReading = targetLanguage === "ja"
                                    ? selectPrimaryJapaneseReading(suggestion.text, suggestion.readings)
                                    : null
                                return (
                                    <FadeIn key={suggestion.text} delayMs={index * 70} durationMs={280}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSuggestions(current => {
                                                const next = new Set(current)
                                                if (next.has(suggestion.text)) next.delete(suggestion.text)
                                                else next.add(suggestion.text)
                                                return next
                                            })}
                                            aria-pressed={isSelected}
                                            className={`flex w-full items-center justify-between gap-4 rounded-2xl border-2 px-5 py-5 text-left text-lg font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                                                isSelected
                                                    ? `${palette.border} ${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}`
                                                    : `${palette.border} bg-white/8 text-white hover:bg-white/12`
                                            }`}
                                        >
                                            <span>
                                                <span className="block">
                                                    {suggestion.text}
                                                    {primaryJapaneseReading && (
                                                        <span className="font-bold opacity-70">
                                                            {" "}({primaryJapaneseReading.text})
                                                        </span>
                                                    )}
                                                </span>
                                                 {(suggestion.gender || suggestion.variant !== "default") && (
                                                     <span className="mt-1 block text-xs font-bold opacity-65">
                                                         {suggestion.gender === "masculine" || suggestion.variant === "masculine-singular"
                                                             ? copy.masculine
                                                             : copy.feminine}
                                                     </span>
                                                 )}
                                            </span>
                                            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${isSelected ? "border-current" : "border-white/35"}`}>
                                                {isSelected && <Check size={17} strokeWidth={3} />}
                                            </span>
                                        </button>
                                    </FadeIn>
                                )
                            })}
                            </div>

                            {suggestions.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsContextOpen(true)}
                                        className="text-sm font-bold text-white/65 underline decoration-white/30 underline-offset-4 transition hover:text-white"
                                    >
                                        {copy.wrongMeaning}
                                    </button>
                                    {supportsGrammaticalForms && !formsAttempted && (
                                        <button
                                            type="button"
                                            onClick={() => void loadGrammaticalForms()}
                                            className="text-sm font-bold text-white/65 underline decoration-white/30 underline-offset-4 transition hover:text-white"
                                        >
                                            {copy.showGrammaticalForms}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setIsManualOpen(true)}
                                        className="text-sm font-bold text-white/65 underline decoration-white/30 underline-offset-4 transition hover:text-white"
                                    >
                                        {copy.enterManually}
                                    </button>
                                </div>
                            )}

                            {isLoadingForms && <p className="mt-4 text-sm font-semibold text-white/55" role="status" aria-live="polite">{copy.loadingGrammaticalForms}</p>}
                            {formsError && <p className="mt-4 text-sm font-semibold text-amber-200">{copy.grammaticalFormsUnavailable}</p>}

                            {isContextOpen && (
                                <FadeIn className="mt-6" delayMs={0} durationMs={240}>
                                    <form onSubmit={submitContext}>
                                        <label htmlFor="translation-context" className="text-sm font-black text-white/80">{copy.addContext}</label>
                                        <p id="translation-context-help" className="mt-1 text-sm font-semibold text-white/50">{copy.contextHelper}</p>
                                        <textarea
                                            id="translation-context"
                                            value={contextText}
                                            onChange={event => {
                                                const value = event.target.value
                                                setContextText(value)
                                                if (!value.trim() && activeContext) void loadSuggestions(sourceText)
                                            }}
                                            maxLength={500}
                                            rows={2}
                                            placeholder={copy.contextPlaceholder}
                                            aria-describedby="translation-context-help"
                                            className={`mt-3 w-full resize-none rounded-2xl border-2 ${palette.border} bg-white/8 px-4 py-3 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${textTone.inputClass} ${textTone.placeholderClass}`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={contextText.trim().length === 0 || contextText.trim().length > 500 || isLoading}
                                            className={`mt-3 min-h-11 rounded-full px-5 py-2 text-sm font-black ${palette.primaryButton} ${palette.primaryButtonText} disabled:cursor-not-allowed disabled:opacity-45`}
                                        >
                                            {copy.applyContext}
                                        </button>
                                    </form>
                                </FadeIn>
                            )}

                            {canShowManualEntry && !isManualOpen && (
                                <button
                                    type="button"
                                    onClick={() => setIsManualOpen(true)}
                                    className="mt-5 text-sm font-bold text-white/65 underline decoration-white/30 underline-offset-4 transition hover:text-white"
                                >
                                    {copy.enterManually}
                                </button>
                            )}

                            {isManualOpen && (
                                <FadeIn className="mt-6" delayMs={0} durationMs={240}>
                                    <label htmlFor="manual-translation" className="text-sm font-black text-white/80">{copy.manualTranslation}</label>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                                        <input
                                            id="manual-translation"
                                            value={manualTranslation}
                                            onChange={event => setManualTranslation(event.target.value)}
                                            placeholder={copy.manualTranslationPlaceholder}
                                            className={`min-h-12 min-w-0 rounded-2xl border-2 ${palette.border} bg-white/8 px-5 py-3 text-base font-bold outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${textTone.inputClass} ${textTone.placeholderClass}`}
                                        />
                                        <button
                                            type="button"
                                            disabled={!sourceText.trim() || !manualTranslation.trim()}
                                            onClick={() => addTranslations([{
                                                text: manualTranslation.trim(),
                                                detectedSourceLanguage: null,
                                                variant: "default"
                                            }])}
                                            className={`min-h-12 rounded-full px-6 py-3 text-sm font-black ${palette.primaryButton} ${palette.primaryButtonText} transition disabled:cursor-not-allowed disabled:opacity-45`}
                                        >
                                            {copy.addToDeck}
                                        </button>
                                    </div>
                                </FadeIn>
                            )}

                            {selectedSuggestions.size > 0 && (
                                <FadeIn delayMs={80} durationMs={280}>
                                    <button
                                        type="button"
                                        onClick={() => addTranslations(
                                            suggestions.filter(suggestion => selectedSuggestions.has(suggestion.text))
                                        )}
                                        className={`mt-6 min-h-12 w-full rounded-full px-6 py-3 text-sm font-black ${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow} transition hover:-translate-y-0.5`}
                                    >
                                        {copy.addSelected} · {copy.selectedCount.replace("{count}", String(selectedSuggestions.size))}
                                    </button>
                                </FadeIn>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>,
        document.body
    )
}

interface SaveDeckDialogProps {
    deckName: string
    description: string
    isSaving: boolean
    error: string
    partialDeckId: number | null
    onDeckNameChange: (value: string) => void
    onDescriptionChange: (value: string) => void
    onSubmit: (event: FormEvent) => void
    onClose: () => void
    onOpenEditor: () => void
}

function SaveDeckDialog({
    deckName,
    description,
    isSaving,
    error,
    partialDeckId,
    onDeckNameChange,
    onDescriptionChange,
    onSubmit,
    onClose,
    onOpenEditor
}: SaveDeckDialogProps) {
    const { t } = useI18n()
    const { palette, textTone } = useTheme()
    const copy = t.createDeckAssistant
    const nameInputRef = useRef<HTMLInputElement>(null)
    const dialogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        nameInputRef.current?.focus()
        const handleEscape = (event: globalThis.KeyboardEvent) => {
            if (event.key === "Escape" && !isSaving) {
                onClose()
                return
            }
            if (event.key !== "Tab") return

            const focusableElements = Array.from(
                dialogRef.current?.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                ) ?? []
            )
            if (focusableElements.length === 0) return
            const first = focusableElements[0]
            const last = focusableElements[focusableElements.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }
        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, [isSaving, onClose])

    return createPortal(
        <div ref={dialogRef} className="fixed inset-0 z-[310] grid place-items-center overflow-y-auto bg-black/80 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="save-deck-title">
            <GradientFrame glow radius={20} radiusClass="w-full max-w-xl rounded-[20px]" contentClassName="rounded-[inherit] bg-slate-950/95 p-6 sm:p-8">
                <form onSubmit={onSubmit}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 id="save-deck-title" className="text-2xl font-black text-white">{copy.deckDetailsTitle}</h2>
                            <p className="mt-2 text-sm font-semibold leading-6 text-white/55">{copy.deckDetailsDescription}</p>
                        </div>
                        <button type="button" onClick={onClose} disabled={isSaving} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white" aria-label={copy.cancel}>
                            <X size={20} />
                        </button>
                    </div>

                    <label className="mt-7 block text-sm font-black text-white/75" htmlFor="deck-name">{copy.deckName}</label>
                    <input
                        ref={nameInputRef}
                        id="deck-name"
                        value={deckName}
                        onChange={event => onDeckNameChange(event.target.value)}
                        placeholder={copy.deckNamePlaceholder}
                        maxLength={120}
                        className={`mt-2 w-full rounded-2xl border-2 ${palette.border} bg-white/8 px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-white/40 ${textTone.inputClass} ${textTone.placeholderClass}`}
                    />

                    <label className="mt-5 block text-sm font-black text-white/75" htmlFor="deck-description">{copy.description}</label>
                    <textarea
                        id="deck-description"
                        value={description}
                        onChange={event => onDescriptionChange(event.target.value)}
                        placeholder={copy.descriptionPlaceholder}
                        rows={3}
                        className={`mt-2 w-full resize-none rounded-2xl border-2 ${palette.border} bg-white/8 px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-white/40 ${textTone.inputClass} ${textTone.placeholderClass}`}
                    />

                    {error && <p className="mt-4 text-sm font-bold leading-6 text-red-300" role="alert">{error}</p>}

                    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} disabled={isSaving} className="min-h-12 rounded-full border border-white/20 px-6 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white">
                            {copy.cancel}
                        </button>
                        {partialDeckId ? (
                            <button type="button" onClick={onOpenEditor} className={`min-h-12 rounded-full px-6 py-3 text-sm font-black ${palette.primaryButton} ${palette.primaryButtonText}`}>
                                {copy.openClassicEditor}
                            </button>
                        ) : (
                            <button type="submit" disabled={isSaving} className={`min-h-12 rounded-full px-6 py-3 text-sm font-black ${palette.primaryButton} ${palette.primaryButtonText} transition disabled:opacity-50`}>
                                {isSaving ? copy.saving : copy.createDeck}
                            </button>
                        )}
                    </div>
                </form>
            </GradientFrame>
        </div>,
        document.body
    )
}
