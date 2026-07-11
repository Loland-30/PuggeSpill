import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { useAuth } from "../auth/AuthContext"
import { en, type Dictionary } from "./dictionaries/en"
import { es } from "./dictionaries/es"
import { ja } from "./dictionaries/ja"
import { no } from "./dictionaries/no"
import {
    APP_LANGUAGE_STORAGE_KEY,
    USE_REGION_LANGUAGE_STORAGE_KEY,
    getAppLanguageLocale,
    normalizeAppLanguage,
    resolveAppLanguage,
    type AppLanguageCode
} from "./localeMap"

const dictionaries: Record<AppLanguageCode, Dictionary> = { en, no, es, ja }

interface I18nContextValue {
    t: Dictionary
    appLanguage: AppLanguageCode
    manualAppLanguage: AppLanguageCode
    useRegionLanguage: boolean
    setManualAppLanguage: (language: string) => void
    setUseRegionLanguage: (enabled: boolean) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [manualAppLanguage, setManualAppLanguageState] = useState<AppLanguageCode>(() => normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)))
    const [useRegionLanguage, setUseRegionLanguageState] = useState(() => localStorage.getItem(USE_REGION_LANGUAGE_STORAGE_KEY) === "true")
    const appLanguage = resolveAppLanguage(user?.country, manualAppLanguage, useRegionLanguage)

    useEffect(() => {
        document.documentElement.lang = getAppLanguageLocale(appLanguage)
    }, [appLanguage])

    const value = useMemo<I18nContextValue>(() => ({
        t: dictionaries[appLanguage],
        appLanguage,
        manualAppLanguage,
        useRegionLanguage,
        setManualAppLanguage: (language: string) => {
            const normalized = normalizeAppLanguage(language)
            localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, normalized)
            setManualAppLanguageState(normalized)
        },
        setUseRegionLanguage: (enabled: boolean) => {
            localStorage.setItem(USE_REGION_LANGUAGE_STORAGE_KEY, String(enabled))
            setUseRegionLanguageState(enabled)
        }
    }), [appLanguage, manualAppLanguage, useRegionLanguage])

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) throw new Error("useI18n must be used within I18nProvider")
    return context
}
