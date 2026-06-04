import { API_ORIGIN } from "../api/config"

export function resolveAssetUrl(value: string | null | undefined) {
    if (!value) return null
    if (/^https?:\/\//i.test(value)) return value
    return `${API_ORIGIN}/${value.replace(/^\/+/, "")}`
}
