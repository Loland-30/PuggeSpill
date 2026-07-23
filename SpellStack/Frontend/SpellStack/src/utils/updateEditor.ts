export const UPDATE_VERSION_MAX_LENGTH = 32
export const UPDATE_TITLE_MAX_LENGTH = 180
export const UPDATE_SUMMARY_MAX_LENGTH = 500

export function deriveUpdateSummary(content: string) {
    const blocks = content.replace(/\r\n?/g, "\n").split(/\n\s*\n/)

    for (const block of blocks) {
        const meaningfulLines = block
            .split("\n")
            .map(line => line.trim())
            .filter(line => line && line !== "---" && !/^#{1,6}\s/.test(line) && !/^[-*+]\s+/.test(line))

        if (meaningfulLines.length === 0) continue

        const summary = meaningfulLines
            .join(" ")
            .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
            .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
            .replace(/[*_~`>#]/g, "")
            .replace(/\s+/g, " ")
            .trim()

        if (summary) return summary.slice(0, UPDATE_SUMMARY_MAX_LENGTH).trimEnd()
    }

    return "Update details"
}

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
