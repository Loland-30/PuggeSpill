import { appLanguages } from "../data/languages"

export type AppLanguageCode = "en" | "no" | "es" | "ja"

export const APP_LANGUAGE_STORAGE_KEY = "spellstack_app_language"
export const USE_REGION_LANGUAGE_STORAGE_KEY = "spellstack_use_region_language"
const supportedAppLanguageCodes: AppLanguageCode[] = ["en", "no", "es", "ja"]

const countryToAppLanguage: Partial<Record<string, AppLanguageCode>> = {
    NO: "no",
    ES: "es",
    MX: "es",
    AR: "es",
    CL: "es",
    CO: "es",
    PE: "es",
    VE: "es",
    EC: "es",
    UY: "es",
    PY: "es",
    BO: "es",
    CR: "es",
    PA: "es",
    GT: "es",
    HN: "es",
    SV: "es",
    NI: "es",
    CU: "es",
    DO: "es",
    JP: "ja",
    GB: "en",
    IE: "en",
    US: "en",
    CA: "en",
    AU: "en",
    NZ: "en"
}

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

export function resolveAppLanguage(countryCode: string | null | undefined, manualLanguage: string, syncWithCountry: boolean): AppLanguageCode {
    if (!syncWithCountry || !countryCode) return normalizeAppLanguage(manualLanguage)
    return countryToAppLanguage[countryCode.toUpperCase()] ?? normalizeAppLanguage(manualLanguage)
}
