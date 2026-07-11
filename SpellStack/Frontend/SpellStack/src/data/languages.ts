export interface Language {
    code: string
    label: string
    flagUrl: string
}

export interface AppLanguage extends Language {
    locale: string
}

export const languages: Language[] = [
    { code: "no", label: "Norsk", flagUrl: "https://flagcdn.com/w40/no.png" },
    { code: "en", label: "Engelsk", flagUrl: "https://flagcdn.com/w40/gb.png" },
    { code: "es", label: "Spansk", flagUrl: "https://flagcdn.com/w40/es.png" },
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
