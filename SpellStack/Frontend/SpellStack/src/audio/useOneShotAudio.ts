import { useEffect } from "react"

const oneShotAudioCache = new Map<string, HTMLAudioElement>()

interface OneShotAudioOptions {
    source?: string | null
    fallbackSource?: string | null
    enabled: boolean
    volume: number
}

function clampVolume(volume: number) {
    return Math.min(1, Math.max(0, volume))
}

export function preloadOneShotAudio(source?: string | null) {
    if (!source || typeof Audio === "undefined") return null

    const cachedAudio = oneShotAudioCache.get(source)
    if (cachedAudio) return cachedAudio

    const audio = new Audio(source)
    audio.preload = "auto"
    audio.load()
    oneShotAudioCache.set(source, audio)

    return audio
}

function createPlaybackAudio(source: string) {
    const cachedAudio = preloadOneShotAudio(source)
    if (!cachedAudio) return null

    const audio = cachedAudio.cloneNode(true) as HTMLAudioElement
    audio.preload = "auto"
    audio.currentTime = 0
    return audio
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

        const initialAudio = createPlaybackAudio(primarySource)
        if (!initialAudio) return

        let audio: HTMLAudioElement = initialAudio
        let disposed = false
        let usingFallback = !source || source === fallbackSource

        const play = () => {
            audio.currentTime = 0
            audio.volume = clampVolume(volume)
            audio.play().catch(() => undefined)
        }

        const handleError = () => {
            if (disposed || usingFallback || !fallbackSource) return

            audio.pause()
            audio.removeEventListener("error", handleError)
            usingFallback = true
            const fallbackAudio = createPlaybackAudio(fallbackSource)
            if (!fallbackAudio) return

            audio = fallbackAudio
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
