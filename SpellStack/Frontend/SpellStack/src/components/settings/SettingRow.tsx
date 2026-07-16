import type { ReactNode } from "react"

interface SettingRowProps {
    label: string
    description: string
    children: ReactNode
    disabled?: boolean
}

export default function SettingRow({ label, description, children, disabled = false }: SettingRowProps) {
    return (
        <div className={`grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)] md:items-center md:gap-x-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] ${disabled ? "opacity-55" : ""}`}>
            <div className="min-w-0">
                <p className="text-base font-black text-white">{label}</p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-white/52">{description}</p>
            </div>
            <div className="flex min-w-0 items-center md:w-full md:max-w-[22rem] md:justify-self-end md:justify-end">
                {children}
            </div>
        </div>
    )
}
