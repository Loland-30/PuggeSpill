import { Platform } from "react-native"

const platformDefaultApiUrl = Platform.select({
    android: "http://10.0.2.2:5084/api",
    ios: "http://localhost:5084/api",
    web: "http://localhost:5084/api",
    default: "http://localhost:5084/api"
})

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? platformDefaultApiUrl ?? "http://localhost:5084/api").replace(/\/+$/, "")
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "")
