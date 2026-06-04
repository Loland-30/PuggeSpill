export interface Language {
    code: string
    label: string
}

export const languages: Language[] = [
    { code: "no", label: "Norwegian" },
    { code: "en", label: "English" },
    { code: "es", label: "Spanish" },
    { code: "ja", label: "Japanese" },
    { code: "fr", label: "French" },
    { code: "de", label: "German" },
    { code: "it", label: "Italian" },
    { code: "pt", label: "Portuguese" }
]

export function getLanguageLabel(code: string) {
    return languages.find(language => language.code === code)?.label ?? code.toUpperCase()
}
