export interface Language {
    code: string
    label: string
    flagUrl: string
    localizedLabels?: Record<string, string>
    aliases?: string[]
}

export interface AppLanguage extends Language {
    locale: string
}

const latinAmericaRegionIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 28'%3E%3Crect width='40' height='28' rx='5' fill='%23075985'/%3E%3Ccircle cx='20' cy='14' r='9' fill='%2338bdf8'/%3E%3Cpath d='M14 8c3-3 9-3 12 0l-3 2-1 3-3 1-2 4-2-2 1-3-3-2z' fill='%23dcfce7'/%3E%3C/svg%3E"

export const languages: Language[] = [
    { code: "no", label: "Norsk", flagUrl: "https://flagcdn.com/w40/no.png" },
    { code: "en", label: "Engelsk", flagUrl: "https://flagcdn.com/w40/gb.png" },
    {
        code: "es",
        label: "Spansk (Spania)",
        flagUrl: "https://flagcdn.com/w40/es.png",
        localizedLabels: {
            en: "Spanish (Spain)",
            nb: "Spansk (Spania)",
            es: "Español (España)",
            ja: "スペインのスペイン語"
        },
        aliases: ["spansk", "spanish", "español"]
    },
    {
        code: "es-419",
        label: "Spansk (Latin-Amerika)",
        flagUrl: latinAmericaRegionIcon,
        localizedLabels: {
            en: "Spanish (Latin America)",
            nb: "Spansk (Latin-Amerika)",
            es: "Español (Latinoamérica)",
            ja: "ラテンアメリカのスペイン語"
        },
        aliases: ["latin american spanish", "spansk latin-amerika", "español latinoamérica"]
    },
    { code: "ja", label: "Japansk", flagUrl: "https://flagcdn.com/w40/jp.png" },
    { code: "fr", label: "Fransk", flagUrl: "https://flagcdn.com/w40/fr.png" },
    { code: "de", label: "Tysk", flagUrl: "https://flagcdn.com/w40/de.png" },
    { code: "it", label: "Italiensk", flagUrl: "https://flagcdn.com/w40/it.png" },
    { code: "pt", label: "Portugisisk", flagUrl: "https://flagcdn.com/w40/pt.png" },
    { code: "zh", label: "Kinesisk", flagUrl: "https://flagcdn.com/w40/cn.png" },
    { code: "ko", label: "Koreansk", flagUrl: "https://flagcdn.com/w40/kr.png" },
    { code: "ar", label: "Arabisk", flagUrl: "https://flagcdn.com/w40/sa.png" },
    { code: "hi", label: "Hindi", flagUrl: "https://flagcdn.com/w40/in.png" },
    { code: "bn", label: "Bengali", flagUrl: "https://flagcdn.com/w40/bd.png" },
    { code: "ru", label: "Russisk", flagUrl: "https://flagcdn.com/w40/ru.png" },
    { code: "pl", label: "Polsk", flagUrl: "https://flagcdn.com/w40/pl.png" },
    { code: "nl", label: "Nederlandsk", flagUrl: "https://flagcdn.com/w40/nl.png" },
    { code: "sv", label: "Svensk", flagUrl: "https://flagcdn.com/w40/se.png" },
    { code: "da", label: "Dansk", flagUrl: "https://flagcdn.com/w40/dk.png" },
    { code: "fi", label: "Finsk", flagUrl: "https://flagcdn.com/w40/fi.png" },
    { code: "is", label: "Islandsk", flagUrl: "https://flagcdn.com/w40/is.png" },
    { code: "tr", label: "Tyrkisk", flagUrl: "https://flagcdn.com/w40/tr.png" },
    { code: "el", label: "Gresk", flagUrl: "https://flagcdn.com/w40/gr.png" },
    { code: "he", label: "Hebraisk", flagUrl: "https://flagcdn.com/w40/il.png" },
    { code: "th", label: "Thai", flagUrl: "https://flagcdn.com/w40/th.png" },
    { code: "vi", label: "Vietnamesisk", flagUrl: "https://flagcdn.com/w40/vn.png" },
    { code: "id", label: "Indonesisk", flagUrl: "https://flagcdn.com/w40/id.png" },
    { code: "ms", label: "Malay", flagUrl: "https://flagcdn.com/w40/my.png" },
    { code: "uk", label: "Ukrainsk", flagUrl: "https://flagcdn.com/w40/ua.png" },
    { code: "cs", label: "Tsjekkisk", flagUrl: "https://flagcdn.com/w40/cz.png" },
    { code: "ro", label: "Rumensk", flagUrl: "https://flagcdn.com/w40/ro.png" },
    { code: "hu", label: "Ungarsk", flagUrl: "https://flagcdn.com/w40/hu.png" },
    { code: "sw", label: "Swahili", flagUrl: "https://flagcdn.com/w40/tz.png" },
    { code: "fa", label: "Persisk", flagUrl: "https://flagcdn.com/w40/ir.png" },
    { code: "ur", label: "Urdu", flagUrl: "https://flagcdn.com/w40/pk.png" }
]

export const appLanguages: AppLanguage[] = [
    { code: "en", locale: "en", label: "English", flagUrl: "https://flagcdn.com/w40/gb.png" },
    { code: "no", locale: "nb-NO", label: "Norsk", flagUrl: "https://flagcdn.com/w40/no.png" },
    { code: "es", locale: "es-ES", label: "Espa\u00f1ol", flagUrl: "https://flagcdn.com/w40/es.png" },
    { code: "ja", locale: "ja-JP", label: "\u65e5\u672c\u8a9e", flagUrl: "https://flagcdn.com/w40/jp.png" }
]

export function uppercaseFirstGrapheme(value: string, locale = "en") {
    if (!value) return value

    const firstGrapheme = typeof Intl.Segmenter === "function"
        ? Array.from(new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(value))[0]?.segment
        : Array.from(value)[0]

    if (!firstGrapheme) return value
    return firstGrapheme.toLocaleUpperCase(locale) + value.slice(firstGrapheme.length)
}

export function getLanguageName(code: string, locale = "en") {
    const language = languages.find(option => option.code === code.toLowerCase())
    if (!language) return code.toUpperCase()
    const localeKey = locale.toLowerCase().split("-")[0]
    const localizedLabel = language.localizedLabels?.[localeKey]
    if (localizedLabel) return localizedLabel

    try {
        const displayName = new Intl.DisplayNames([locale], { type: "language" }).of(language.code) ?? language.label
        return uppercaseFirstGrapheme(displayName, locale)
    } catch {
        return uppercaseFirstGrapheme(language.label, locale)
    }
}

export function normalizeLanguageCode(value: string | null | undefined) {
    const normalized = value?.trim().toLowerCase()
    const directMatch = languages.find(language =>
        language.code === normalized ||
        language.label.toLowerCase() === normalized ||
        language.aliases?.some(alias => alias.toLowerCase() === normalized)
    )
    if (directMatch) return directMatch.code

    for (const locale of ["en", "nb", "es", "ja"]) {
        const localizedMatch = languages.find(language => getLanguageName(language.code, locale).toLowerCase() === normalized)
        if (localizedMatch) return localizedMatch.code
    }

    return normalized ?? ""
}
