import type { ReactNode } from "react"
import type { PaletteTheme } from "../../theme/themes"

interface SettingsSectionProps {
    id: string
    title: string
    description: string
    children: ReactNode
    palette: PaletteTheme
}

export default function SettingsSection({ id, title, description, children, palette }: SettingsSectionProps) {
    return (
        <section id={id} className="scroll-mt-28">
            <div className={`rounded-2xl border ${palette.border} ${palette.card} ${palette.glow} p-4 backdrop-blur-xl sm:rounded-3xl sm:p-6`}>
                <div className="mb-6 max-w-3xl">
                    <h2 className="text-2xl font-black text-white sm:text-3xl">{title}</h2>
                    <p className="mt-2 text-sm font-medium leading-6 text-white/62">{description}</p>
                </div>

                <div className="divide-y divide-white/10">
                    {children}
                </div>
            </div>
        </section>
    )
}
