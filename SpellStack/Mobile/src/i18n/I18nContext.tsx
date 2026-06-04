import * as SecureStore from "expo-secure-store"
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { en, type Dictionary } from "./dictionaries/en"
import { es } from "./dictionaries/es"
import { ja } from "./dictionaries/ja"
import { no } from "./dictionaries/no"
import { APP_LANGUAGE_STORAGE_KEY, normalizeAppLanguage, type AppLanguageCode } from "./localeMap"

const dictionaries: Record<AppLanguageCode, Dictionary> = { en, no, es, ja }

interface I18nContextValue {
    t: Dictionary
    appLanguage: AppLanguageCode
    setAppLanguage: (language: AppLanguageCode) => Promise<void>
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
    const [appLanguage, setAppLanguageState] = useState<AppLanguageCode>("en")

    useEffect(() => {
        SecureStore.getItemAsync(APP_LANGUAGE_STORAGE_KEY)
            .then(value => setAppLanguageState(normalizeAppLanguage(value)))
            .catch(() => undefined)
    }, [])

    const value = useMemo<I18nContextValue>(() => ({
        t: dictionaries[appLanguage],
        appLanguage,
        setAppLanguage: async (language: AppLanguageCode) => {
            setAppLanguageState(language)
            await SecureStore.setItemAsync(APP_LANGUAGE_STORAGE_KEY, language)
        }
    }), [appLanguage])

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) throw new Error("useI18n must be used inside I18nProvider")
    return context
}
