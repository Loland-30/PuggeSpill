import { authHeaders } from "./auth"
import { API_URL } from "./config"

export interface TranslationSuggestion {
    text: string
    detectedSourceLanguage: string | null
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
    signal?: AbortSignal
): Promise<TranslationSuggestion[]> {
    const response = await fetch(`${API_URL}/translation/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
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
