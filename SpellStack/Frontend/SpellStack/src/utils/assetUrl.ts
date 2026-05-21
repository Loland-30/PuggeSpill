import { API_URL } from "../api/auth"

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "")

export function resolveAssetUrl(path?: string | null): string | null {
    if (!path) return null
    if (/^https?:\/\//i.test(path)) return path

    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return `${API_ORIGIN}${normalizedPath}`
}
