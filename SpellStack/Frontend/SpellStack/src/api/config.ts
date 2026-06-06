const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const API_URL = (configuredApiUrl || "/api").replace(/\/+$/, "")
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "")
