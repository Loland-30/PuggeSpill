import { API_ORIGIN } from "../api/config"

export function resolveAssetUrl(path?: string | null): string | null {
    if (!path) return null
    if (/^https?:\/\//i.test(path)) return path

    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return `${API_ORIGIN}${normalizedPath}`
}
