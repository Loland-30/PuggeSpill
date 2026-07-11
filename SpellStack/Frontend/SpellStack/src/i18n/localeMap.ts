import { appLanguages } from "../data/languages"

export type AppLanguageCode = "en" | "no" | "es" | "ja"

export const APP_LANGUAGE_STORAGE_KEY = "spellstack_app_language"
const supportedAppLanguageCodes: AppLanguageCode[] = ["en", "no", "es", "ja"]

function isAppLanguageCode(value: string | undefined): value is AppLanguageCode {
    return supportedAppLanguageCodes.includes(value as AppLanguageCode)
}

export function normalizeAppLanguage(value: string | null | undefined): AppLanguageCode {
    const normalized = value?.trim().toLowerCase()
    if (isAppLanguageCode(normalized)) return normalized

    const match = appLanguages.find(language =>
        language.code.toLowerCase() === normalized ||
        language.locale.toLowerCase() === normalized ||
        language.label.toLowerCase() === normalized
    )

    return isAppLanguageCode(match?.code) ? match.code : "en"
}

export function getAppLanguageLocale(code: AppLanguageCode) {
    return appLanguages.find(language => language.code === code)?.locale ?? "en"
}
