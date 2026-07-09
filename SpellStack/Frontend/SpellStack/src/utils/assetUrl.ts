import { API_ORIGIN } from "../api/config"

export function resolveAssetUrl(path?: string | null): string | null {
    const trimmedPath = path?.trim()
    if (!trimmedPath) return null
    if (/^https?:\/\//i.test(trimmedPath)) return trimmedPath

    const normalizedPath = trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`
    return `${API_ORIGIN}${normalizedPath}`
}
