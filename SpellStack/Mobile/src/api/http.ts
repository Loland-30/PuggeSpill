const DEFAULT_TIMEOUT_MS = 8000

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal
        })
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error("Request timed out. Check that the backend is reachable from this device.")
        }

        throw error
    } finally {
        clearTimeout(timeout)
    }
}
