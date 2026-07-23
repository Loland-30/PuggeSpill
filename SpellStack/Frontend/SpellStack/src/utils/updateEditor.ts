export const UPDATE_VERSION_MAX_LENGTH = 32
export const UPDATE_TITLE_MAX_LENGTH = 180
export const UPDATE_SUMMARY_MAX_LENGTH = 500

export function getLocalCalendarDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export function toPublishedAt(date: string) {
    return `${date}T12:00:00.000Z`
}

export function fromPublishedAt(value: string | null) {
    return value?.slice(0, 10) ?? getLocalCalendarDate()
}
