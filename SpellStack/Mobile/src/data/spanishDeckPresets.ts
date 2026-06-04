export interface SpanishDeckPresetWord {
    original: string
    translation: string
    acceptedOriginals?: string[]
}

export interface SpanishDeckPreset {
    id: string
    name: string
    description: string
    words: SpanishDeckPresetWord[]
}

export const spanishDeckPresets: SpanishDeckPreset[] = [
    {
        id: "spanish-basics",
        name: "Spanish Basics",
        description: "Beginner words for a first Spanish practice deck.",
        words: [
            { original: "hola", translation: "hello" },
            { original: "adios", translation: "goodbye" },
            { original: "gracias", translation: "thanks" },
            { original: "por favor", translation: "please" },
            { original: "si", translation: "yes" },
            { original: "no", translation: "no" },
            { original: "agua", translation: "water" },
            { original: "comida", translation: "food" },
            { original: "casa", translation: "house" },
            { original: "escuela", translation: "school" },
            { original: "amigo", translation: "friend", acceptedOriginals: ["amiga"] },
            { original: "familia", translation: "family" }
        ]
    }
]
