const LARGER_TEXT_STORAGE_KEY = "spellstack_larger_text"
const LARGER_TEXT_CLASS = "spellstack-larger-text"

export function getStoredLargerText() {
    return localStorage.getItem(LARGER_TEXT_STORAGE_KEY) === "true"
}

export function setGlobalLargerText(enabled: boolean) {
    document.documentElement.classList.toggle(LARGER_TEXT_CLASS, enabled)
    localStorage.setItem(LARGER_TEXT_STORAGE_KEY, String(enabled))
}

export function initializeAccessibilitySettings() {
    setGlobalLargerText(getStoredLargerText())
}