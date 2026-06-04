import { Audio, type AVPlaybackSource } from "expo-av"

export async function playSound(source: AVPlaybackSource, volume = 0.8) {
    try {
        const { sound } = await Audio.Sound.createAsync(source, {
            shouldPlay: true,
            volume
        })

        sound.setOnPlaybackStatusUpdate(status => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync().catch(() => undefined)
            }
        })
    } catch {
        // Sound effects should never interrupt gameplay.
    }
}
