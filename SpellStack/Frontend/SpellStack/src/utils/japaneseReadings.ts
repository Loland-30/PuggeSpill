import type { TranslationReading } from "../api/translation"

function normalizeReadingText(value: string) {
    return value.normalize("NFC").trim()
}

function containsKanji(value: string) {
    return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(value)
}

function isSingleKanji(value: string) {
    const characters = Array.from(value.normalize("NFC").trim())
    return characters.length === 1 && containsKanji(characters[0])
}

function deduplicateReadings(readings: readonly TranslationReading[]) {
    const unique = new Map<string, TranslationReading>()

    for (const reading of readings) {
        const text = normalizeReadingText(reading.text)
        if (!text) continue

        const key = text.toLocaleLowerCase("ja-JP")
        if (!unique.has(key)) {
            unique.set(key, { ...reading, text })
        }
    }

    return Array.from(unique.values())
}

export function selectPrimaryJapaneseReading(
    suggestionText: string,
    readings: readonly TranslationReading[] | null | undefined
): TranslationReading | null {
    const normalizedSuggestion = suggestionText.normalize("NFC").trim()
    if (!normalizedSuggestion || !containsKanji(normalizedSuggestion) || !readings?.length) {
        return null
    }

    const hiraganaReadings = deduplicateReadings(readings)
        .filter(reading => reading.script.toLocaleLowerCase() === "hiragana")

    if (isSingleKanji(normalizedSuggestion)) {
        return hiraganaReadings.find(reading => reading.type.toLocaleLowerCase() === "kun")
            ?? (hiraganaReadings.length === 1 ? hiraganaReadings[0] : null)
    }

    // Compound/okurigana entries use whole-word transliterations with an unknown
    // reading type. Kun/on entries are component readings and are not shown inline.
    return hiraganaReadings.find(reading => reading.type.toLocaleLowerCase() === "unknown")
        ?? null
}
