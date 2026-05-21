export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:5084/api").replace(/\/+$/, "")
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "")
