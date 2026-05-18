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
            <div className={`rounded-3xl border ${palette.border} ${palette.card} ${palette.glow} p-6 backdrop-blur-xl`}>
                <div className="mb-6 max-w-3xl">
                    <h2 className="text-3xl font-black text-white">{title}</h2>
                    <p className="mt-2 text-sm font-medium leading-6 text-white/62">{description}</p>
                </div>

                <div className="divide-y divide-white/10">
                    {children}
                </div>
            </div>
        </section>
    )
}
