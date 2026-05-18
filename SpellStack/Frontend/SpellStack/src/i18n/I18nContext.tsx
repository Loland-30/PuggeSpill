import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { countries } from "../data/languages"
import { en, type Dictionary } from "./dictionaries/en"
import { es } from "./dictionaries/es"
import { ja } from "./dictionaries/ja"
import { no } from "./dictionaries/no"
import { regionalDictionaries } from "./dictionaries/regional"
import {
    APP_LANGUAGE_STORAGE_KEY,
    PROFILE_REGION_STORAGE_KEY,
    USE_REGION_LANGUAGE_STORAGE_KEY,
    getAppLanguageLocale,
    normalizeAppLanguage,
    resolveAppLanguage,
    type AppLanguageCode
} from "./localeMap"

const dictionaries: Record<AppLanguageCode, Dictionary> = { en, no, es, ja, ...regionalDictionaries }

interface I18nContextValue {
    t: Dictionary
    appLanguage: AppLanguageCode
    manualAppLanguage: AppLanguageCode
    countryRegion: string
    useRegionLanguage: boolean
    setManualAppLanguage: (language: string) => void
    setCountryRegion: (country: string) => void
    setUseRegionLanguage: (enabled: boolean) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function normalizeCountryRegion(value: string | null | undefined) {
    const normalized = value?.trim().toLowerCase()
    return countries.find(country =>
        country.code.toLowerCase() === normalized ||
        country.label.toLowerCase() === normalized
    )?.code ?? "no"
}

function getStoredUseRegionLanguage() {
    return localStorage.getItem(USE_REGION_LANGUAGE_STORAGE_KEY) !== "false"
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [countryRegion, setCountryRegionState] = useState(() => normalizeCountryRegion(localStorage.getItem(PROFILE_REGION_STORAGE_KEY)))
    const [manualAppLanguage, setManualAppLanguageState] = useState<AppLanguageCode>(() => normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)))
    const [useRegionLanguage, setUseRegionLanguageState] = useState(getStoredUseRegionLanguage)

    const appLanguage = resolveAppLanguage(countryRegion, manualAppLanguage, useRegionLanguage)

    useEffect(() => {
        document.documentElement.lang = getAppLanguageLocale(appLanguage)
    }, [appLanguage])

    const value = useMemo<I18nContextValue>(() => ({
        t: dictionaries[appLanguage],
        appLanguage,
        manualAppLanguage,
        countryRegion,
        useRegionLanguage,
        setManualAppLanguage: (language: string) => {
            const normalized = normalizeAppLanguage(language)
            localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, normalized)
            setManualAppLanguageState(normalized)
        },
        setCountryRegion: (country: string) => {
            const normalized = normalizeCountryRegion(country)
            localStorage.setItem(PROFILE_REGION_STORAGE_KEY, normalized)
            setCountryRegionState(normalized)
        },
        setUseRegionLanguage: (enabled: boolean) => {
            localStorage.setItem(USE_REGION_LANGUAGE_STORAGE_KEY, String(enabled))
            setUseRegionLanguageState(enabled)
        }
    }), [appLanguage, countryRegion, manualAppLanguage, useRegionLanguage])

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) throw new Error("useI18n must be used within I18nProvider")
    return context
}