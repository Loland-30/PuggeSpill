import type { ReactNode } from "react"

interface SettingRowProps {
    label: string
    description: string
    children: ReactNode
    disabled?: boolean
}

export default function SettingRow({ label, description, children, disabled = false }: SettingRowProps) {
    return (
        <div className={`grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] md:items-center ${disabled ? "opacity-55" : ""}`}>
            <div>
                <p className="text-base font-black text-white">{label}</p>
                <p className="mt-1 text-sm leading-6 text-white/52">{description}</p>
            </div>
            <div className="min-w-0 md:w-full md:max-w-[22rem] md:justify-self-end">
                {children}
            </div>
        </div>
    )
}
