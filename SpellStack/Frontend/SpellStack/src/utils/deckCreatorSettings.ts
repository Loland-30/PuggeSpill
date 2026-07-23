export const DECK_CREATOR_SETTINGS_STORAGE_KEY = "spellstack_deck_creator_settings"

interface DeckCreatorSettings {
    useClassicDeckCreator: boolean
}

const defaultDeckCreatorSettings: DeckCreatorSettings = {
    useClassicDeckCreator: false
}

export function readDeckCreatorSettings(): DeckCreatorSettings {
    try {
        const storedSettings = localStorage.getItem(DECK_CREATOR_SETTINGS_STORAGE_KEY)
        if (!storedSettings) return defaultDeckCreatorSettings

        const parsedSettings = JSON.parse(storedSettings) as Partial<DeckCreatorSettings>
        return {
            useClassicDeckCreator: parsedSettings.useClassicDeckCreator === true
        }
    } catch {
        return defaultDeckCreatorSettings
    }
}

export function saveDeckCreatorSettings(settings: DeckCreatorSettings) {
    localStorage.setItem(DECK_CREATOR_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}
