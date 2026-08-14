import { useCallback, useLayoutEffect, useRef } from "react"

interface AutoFitTextProps {
    text: string
    className?: string
    maxFontSize?: string
    minFontSize?: number
    maxLines?: number
    lineHeight?: number
}

const AutoFitText = ({
    text,
    className = "",
    maxFontSize = "clamp(2.5rem, 3.75vw, 6rem)",
    minFontSize = 10,
    maxLines = 2,
    lineHeight = 1.15
}: AutoFitTextProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLParagraphElement>(null)
    const animationFrameRef = useRef<number | null>(null)

    const fitText = useCallback(() => {
        const container = containerRef.current
        const textElement = textRef.current
        if (!container || !textElement || container.clientWidth === 0) return

        textElement.style.fontSize = maxFontSize
        const computedFontSize = Number.parseFloat(window.getComputedStyle(textElement).fontSize)
        let fittedFontSize = Math.max(minFontSize, Math.floor(computedFontSize))

        const fits = () => {
            const maximumHeight = fittedFontSize * lineHeight * maxLines + 1
            return textElement.scrollWidth <= container.clientWidth + 1 &&
                textElement.scrollHeight <= maximumHeight
        }

        textElement.style.fontSize = `${fittedFontSize}px`
        while (fittedFontSize > minFontSize && !fits()) {
            fittedFontSize -= 1
            textElement.style.fontSize = `${fittedFontSize}px`
        }
    }, [lineHeight, maxFontSize, maxLines, minFontSize])

    const scheduleFit = useCallback(() => {
        if (animationFrameRef.current !== null) {
            window.cancelAnimationFrame(animationFrameRef.current)
        }

        animationFrameRef.current = window.requestAnimationFrame(() => {
            animationFrameRef.current = null
            fitText()
        })
    }, [fitText])

    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container) return
        let disposed = false

        scheduleFit()

        let previousWidth = container.clientWidth
        const resizeObserver = new ResizeObserver(entries => {
            const nextWidth = entries[0]?.contentRect.width ?? container.clientWidth
            if (Math.abs(nextWidth - previousWidth) < 0.5) return

            previousWidth = nextWidth
            scheduleFit()
        })
        resizeObserver.observe(container)

        const fontSet = document.fonts
        const handleFontsLoaded = () => {
            if (!disposed) scheduleFit()
        }
        void fontSet.ready.then(handleFontsLoaded)
        fontSet.addEventListener("loadingdone", handleFontsLoaded)

        const fontStyleObserver = new MutationObserver(scheduleFit)
        fontStyleObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["style", "class"]
        })

        return () => {
            disposed = true
            resizeObserver.disconnect()
            fontSet.removeEventListener("loadingdone", handleFontsLoaded)
            fontStyleObserver.disconnect()
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [scheduleFit, text])

    return (
        <div ref={containerRef} className="min-w-0 w-full">
            <p
                ref={textRef}
                className={`max-w-full whitespace-normal hyphens-none [overflow-wrap:normal] [word-break:normal] ${className}`}
                style={{ fontSize: maxFontSize, lineHeight }}
            >
                {text}
            </p>
        </div>
    )
}

export default AutoFitText
