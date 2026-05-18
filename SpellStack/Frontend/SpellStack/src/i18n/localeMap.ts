import { appLanguages } from "../data/languages"

export const appLanguageCodes = [
    "en", "no", "es", "ja", "sv", "da", "fi", "is", "fr", "de", "it", "pt", "nl", "pl", "cs", "ru", "el", "tr", "uk", "zh", "ko", "ar", "hi", "bn", "he", "th", "vi", "id", "ms", "ro", "hu", "sw", "fa", "ur"
] as const

export type AppLanguageCode = typeof appLanguageCodes[number]

export const APP_LANGUAGE_STORAGE_KEY = "spellstack_app_language"
export const PROFILE_REGION_STORAGE_KEY = "spellstack_profile_region"
export const USE_REGION_LANGUAGE_STORAGE_KEY = "spellstack_use_region_language"

function isAppLanguageCode(value: string | undefined): value is AppLanguageCode {
    return appLanguageCodes.includes(value as AppLanguageCode)
}

export const countryToAppLanguage: Partial<Record<string, AppLanguageCode>> = {
    no: "no",
    se: "sv",
    dk: "da",
    fi: "fi",
    is: "is",
    gb: "en",
    ie: "en",
    us: "en",
    ca: "en",
    au: "en",
    nz: "en",
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
    pt: "pt",
    br: "pt",
    fr: "fr",
    lu: "fr",
    mc: "fr",
    de: "de",
    at: "de",
    ch: "de",
    li: "de",
    it: "it",
    sm: "it",
    nl: "nl",
    be: "nl",
    pl: "pl",
    cz: "cs",
    sk: "cs",
    ru: "ru",
    by: "ru",
    kz: "ru",
    kg: "ru",
    gr: "el",
    cy: "el",
    tr: "tr",
    ua: "uk",
    cn: "zh",
    tw: "zh",
    hk: "zh",
    jp: "ja",
    kr: "ko",
    sa: "ar",
    ae: "ar",
    qa: "ar",
    eg: "ar",
    ma: "ar",
    dz: "ar",
    tn: "ar",
    iq: "ar",
    sy: "ar",
    jo: "ar",
    lb: "ar",
    om: "ar",
    kw: "ar",
    bh: "ar",
    ye: "ar",
    in: "hi",
    bd: "bn",
    pk: "ur",
    il: "he",
    th: "th",
    vn: "vi",
    id: "id",
    my: "ms",
    bn: "ms",
    ro: "ro",
    md: "ro",
    hu: "hu",
    ir: "fa",
    af: "fa",
    tz: "sw",
    ke: "sw",
    ug: "sw",
    rw: "sw",
    bi: "sw"
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