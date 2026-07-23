interface UpdateDescriptionProps {
    summary: string
    className?: string
}

export default function UpdateDescription({ summary, className = "" }: UpdateDescriptionProps) {
    const description = summary.trim()
    if (!description) return null

    return <p className={className}>{description}</p>
}
