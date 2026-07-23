import { authHeaders } from "./auth"
import { API_URL } from "./config"

export interface TranslationSuggestion {
    text: string
    detectedSourceLanguage: string | null
    variant: TranslationRequestVariant
    partOfSpeech?: string | null
    gender?: "masculine" | "feminine" | string | null
    number?: "singular" | "plural" | string | null
    inferred?: boolean | null
    readings?: TranslationReading[] | null
}

export interface TranslationReading {
    text: string
    type: "kun" | "on" | "unknown" | string
    script: "hiragana" | "katakana" | "unknown" | string
    tags: string[]
}

export type TranslationRequestVariant = "default" | "masculine-singular" | "feminine-singular"

export interface TranslationSuggestionOptions {
    context?: string
    requestVariant?: TranslationRequestVariant
}

export type TranslationErrorCode =
    | "invalid_request"
    | "unsupported_language_pair"
    | "not_configured"
    | "rate_limited"
    | "provider_unavailable"
    | "unknown"

export class TranslationApiError extends Error {
    readonly code: TranslationErrorCode
    readonly status: number

    constructor(message: string, code: TranslationErrorCode, status: number) {
        super(message)
        this.code = code
        this.status = status
    }
}

export async function getTranslationSuggestions(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    options?: TranslationSuggestionOptions,
    signal?: AbortSignal
): Promise<TranslationSuggestion[]> {
    const response = await fetch(`${API_URL}/translation/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
            text,
            sourceLanguage,
            targetLanguage,
            context: options?.context?.trim() || null,
            requestVariant: options?.requestVariant ?? "default"
        }),
        signal
    })

    if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string; code?: TranslationErrorCode } | null
        throw new TranslationApiError(
            body?.message || "Could not load translation suggestions.",
            body?.code || "unknown",
            response.status
        )
    }

    const body = await response.json() as { suggestions?: TranslationSuggestion[] }
    return body.suggestions ?? []
}
