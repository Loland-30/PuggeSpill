import type { TranslationReading } from "../api/translation"

function normalizeReadingText(value: string) {
    return value.normalize("NFC").trim()
}

export function getJapaneseReadingVariants(
    readings: readonly TranslationReading[] | null | undefined
): TranslationReading[] {
    if (!readings?.length) return []

    const variants: TranslationReading[] = []
    const seen = new Set<string>()

    for (const reading of readings) {
        const text = normalizeReadingText(reading.text)
        if (!text) continue
        const existingIndex = variants.findIndex(variant => variant.text === text)
        if (existingIndex >= 0) {
            if (!variants[existingIndex].romanization && reading.romanization) {
                variants[existingIndex] = {
                    ...variants[existingIndex],
                    romanization: reading.romanization.trim() || null
                }
            }
            continue
        }
        if (!seen.add(text)) continue
        variants.push({
            ...reading,
            text,
            romanization: reading.romanization?.trim() || null,
            tags: [...reading.tags]
        })
    }

    return variants
}
