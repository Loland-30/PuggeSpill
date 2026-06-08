import { useEffect } from "react"

interface OneShotAudioOptions {
    source?: string | null
    fallbackSource?: string | null
    enabled: boolean
    volume: number
}

export function useOneShotAudio({
    source,
    fallbackSource,
    enabled,
    volume
}: OneShotAudioOptions) {
    useEffect(() => {
        if (!enabled || volume <= 0) return

        const primarySource = source || fallbackSource
        if (!primarySource) return

        let audio = new Audio(primarySource)
        let disposed = false
        let usingFallback = !source || source === fallbackSource

        const play = () => {
            audio.preload = "auto"
            audio.volume = Math.min(1, Math.max(0, volume))
            audio.play().catch(() => undefined)
        }

        const handleError = () => {
            if (disposed || usingFallback || !fallbackSource) return

            audio.pause()
            usingFallback = true
            audio = new Audio(fallbackSource)
            audio.addEventListener("error", handleError)
            play()
        }

        audio.addEventListener("error", handleError)
        play()

        return () => {
            disposed = true
            audio.removeEventListener("error", handleError)
            audio.pause()
            audio.currentTime = 0
        }
    }, [enabled, fallbackSource, source, volume])
}
