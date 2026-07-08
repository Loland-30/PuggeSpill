const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const fallbackApiUrl = import.meta.env.DEV ? "http://localhost:5084/api" : "/api"

function trimTrailingSlashes(value: string) {
    return value.replace(/\/+$/, "")
}

function toApiUrl(baseUrl: string) {
    const normalizedBaseUrl = trimTrailingSlashes(baseUrl)
    return normalizedBaseUrl.toLowerCase().endsWith("/api")
        ? normalizedBaseUrl
        : `${normalizedBaseUrl}/api`
}

export const API_URL = configuredApiUrl
    ? trimTrailingSlashes(configuredApiUrl)
    : configuredApiBaseUrl
        ? toApiUrl(configuredApiBaseUrl)
        : fallbackApiUrl
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "")
