export type AppLanguageCode = "en" | "no" | "es" | "ja"

export const APP_LANGUAGE_STORAGE_KEY = "spellstack_app_language"

const supportedAppLanguageCodes: AppLanguageCode[] = ["en", "no", "es", "ja"]

function isAppLanguageCode(value: string | undefined): value is AppLanguageCode {
    return supportedAppLanguageCodes.includes(value as AppLanguageCode)
}

export function normalizeAppLanguage(value: string | null | undefined): AppLanguageCode {
    const normalized = value?.trim().toLowerCase()
    return isAppLanguageCode(normalized) ? normalized : "en"
}

export function getAppLanguageLocale(code: AppLanguageCode) {
    if (code === "no") return "nb-NO"
    if (code === "es") return "es-ES"
    if (code === "ja") return "ja-JP"
    return "en"
}
