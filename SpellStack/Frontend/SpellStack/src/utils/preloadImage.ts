export function preloadImage(src: string | null | undefined, timeoutMs = 2500): Promise<void> {
    const imageSrc = src?.trim()
    if (!imageSrc) return Promise.resolve()

    return new Promise(resolve => {
        const image = new Image()
        let settled = false

        const settle = () => {
            if (settled) return
            settled = true
            window.clearTimeout(timeout)
            resolve()
        }

        const timeout = window.setTimeout(settle, timeoutMs)

        image.onload = settle
        image.onerror = settle
        image.src = imageSrc
    })
}
