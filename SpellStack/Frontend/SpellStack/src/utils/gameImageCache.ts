import { enemies } from "../data/enemies/enemies"
import { zones } from "../data/zones/zones"

const imagePromises = new Map<string, Promise<HTMLImageElement>>()
const loadedImages = new Map<string, HTMLImageElement>()

function uniqueUrls(urls: Array<string | null | undefined>) {
    return Array.from(new Set(urls.filter((url): url is string => !!url)))
}

export function getGameImageUrls() {
    return uniqueUrls([
        ...zones.map(zone => zone.backgroundUrl),
        ...enemies.flatMap(enemy => [enemy.imageUrl, enemy.deathImageUrl])
    ])
}

export function cacheImage(url: string) {
    const loadedImage = loadedImages.get(url)
    if (loadedImage) return Promise.resolve(loadedImage)

    const existingPromise = imagePromises.get(url)
    if (existingPromise) return existingPromise

    const image = new Image()
    image.decoding = "async"
    image.loading = "eager"

    const promise = new Promise<HTMLImageElement>(resolve => {
        image.onload = () => {
            const decodePromise = image.decode
                ? image.decode().catch(() => undefined)
                : Promise.resolve()

            decodePromise.then(() => {
                loadedImages.set(url, image)
                resolve(image)
            })
        }

        image.onerror = () => resolve(image)
        image.src = url
    })

    imagePromises.set(url, promise)
    return promise
}

export function cacheGameImages() {
    return Promise.all(getGameImageUrls().map(cacheImage)).then(() => undefined)
}
