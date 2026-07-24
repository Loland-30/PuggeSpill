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

function isStructuredReading(reading: TranslationReading) {
    // Missing metadata means the reading came from a pre-metadata index,
    // where every reading was extracted from structured forms.
    return reading.source?.toLocaleLowerCase() !== "gloss"
        && reading.confidence?.toLocaleLowerCase() !== "fallback"
}

function isValidHiraganaReading(reading: TranslationReading) {
    const text = normalizeReadingText(reading.text)
    return reading.script.toLocaleLowerCase() === "hiragana"
        && /^[\u3041-\u3096\u3099-\u309f\u30fc]+$/u.test(text)
}

function deduplicateReadings(readings: readonly TranslationReading[]) {
    const unique = new Map<string, TranslationReading>()

    for (const reading of readings) {
        const text = normalizeReadingText(reading.text)
        if (!text) continue

        const key = text.toLocaleLowerCase("ja-JP")
        const existing = unique.get(key)
        if (!existing || (!isStructuredReading(existing) && isStructuredReading(reading))) {
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
        .filter(isValidHiraganaReading)
    const structuredReadings = hiraganaReadings.filter(isStructuredReading)
    const fallbackReadings = hiraganaReadings.filter(reading => !isStructuredReading(reading))

    if (isSingleKanji(normalizedSuggestion)) {
        if (structuredReadings.length > 0) {
            return structuredReadings.find(reading => reading.type.toLocaleLowerCase() === "kun")
                ?? (structuredReadings.length === 1 ? structuredReadings[0] : null)
        }

        return fallbackReadings[0] ?? null
    }

    // Compound/okurigana entries use whole-word transliterations with an unknown
    // reading type. Gloss candidates are a deterministic fallback in Kaikki sense
    // order; they are not semantically ranked by register or source-language sense.
    return structuredReadings.find(reading => reading.type.toLocaleLowerCase() === "unknown")
        ?? fallbackReadings.find(reading => reading.type.toLocaleLowerCase() === "unknown")
        ?? null
}
