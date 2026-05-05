export interface Language {
    code: string
    label: string
    flagUrl: string
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
]