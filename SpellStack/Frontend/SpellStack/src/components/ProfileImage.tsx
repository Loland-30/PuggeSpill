import { useEffect, useState } from "react"

interface ProfileImageProps {
    src: string | null | undefined
    alt: string
    className?: string
}

export default function ProfileImage({ src, alt, className }: ProfileImageProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null)

    useEffect(() => {
        setFailedSrc(null)
    }, [src])

    if (!src || failedSrc === src) return null

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setFailedSrc(src)}
        />
    )
}
