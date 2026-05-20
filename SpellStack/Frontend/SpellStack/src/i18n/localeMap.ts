import { appLanguages } from "../data/languages"

export type AppLanguageCode = "en" | "no" | "es" | "ja"

export const APP_LANGUAGE_STORAGE_KEY = "spellstack_app_language"
export const PROFILE_REGION_STORAGE_KEY = "spellstack_profile_region"
export const USE_REGION_LANGUAGE_STORAGE_KEY = "spellstack_use_region_language"

const supportedAppLanguageCodes: AppLanguageCode[] = ["en", "no", "es", "ja"]

function isAppLanguageCode(value: string | undefined): value is AppLanguageCode {
    return supportedAppLanguageCodes.includes(value as AppLanguageCode)
}

export const countryToAppLanguage: Partial<Record<string, AppLanguageCode>> = {
    no: "no",
    es: "es",
    mx: "es",
    ar: "es",
    cl: "es",
    co: "es",
    pe: "es",
    ve: "es",
    ec: "es",
    uy: "es",
    py: "es",
    bo: "es",
    cr: "es",
    pa: "es",
    gt: "es",
    hn: "es",
    sv: "es",
    ni: "es",
    cu: "es",
    do: "es",
    jp: "ja",
    gb: "en",
    ie: "en",
    us: "en",
    ca: "en",
    au: "en",
    nz: "en"
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

export function resolveAppLanguage(countryCode: string, manualLanguage: string, useRegionLanguage: boolean): AppLanguageCode {
    if (!useRegionLanguage) return normalizeAppLanguage(manualLanguage)
    return countryToAppLanguage[countryCode.toLowerCase()] ?? "en"
}

export function getAppLanguageLocale(code: AppLanguageCode) {
    return appLanguages.find(language => language.code === code)?.locale ?? "en"
}