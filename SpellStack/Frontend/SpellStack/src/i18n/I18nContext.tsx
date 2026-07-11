import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { en, type Dictionary } from "./dictionaries/en"
import { es } from "./dictionaries/es"
import { ja } from "./dictionaries/ja"
import { no } from "./dictionaries/no"
import {
    APP_LANGUAGE_STORAGE_KEY,
    getAppLanguageLocale,
    normalizeAppLanguage,
    type AppLanguageCode
} from "./localeMap"

const dictionaries: Record<AppLanguageCode, Dictionary> = { en, no, es, ja }

interface I18nContextValue {
    t: Dictionary
    appLanguage: AppLanguageCode
    manualAppLanguage: AppLanguageCode
    setManualAppLanguage: (language: string) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
    const [manualAppLanguage, setManualAppLanguageState] = useState<AppLanguageCode>(() => normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)))
    const appLanguage = manualAppLanguage

    useEffect(() => {
        document.documentElement.lang = getAppLanguageLocale(appLanguage)
    }, [appLanguage])

    const value = useMemo<I18nContextValue>(() => ({
        t: dictionaries[appLanguage],
        appLanguage,
        manualAppLanguage,
        setManualAppLanguage: (language: string) => {
            const normalized = normalizeAppLanguage(language)
            localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, normalized)
            setManualAppLanguageState(normalized)
        },
    }), [appLanguage, manualAppLanguage])

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) throw new Error("useI18n must be used within I18nProvider")
    return context
}
