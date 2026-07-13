import type { PaletteTheme } from "../../theme/themes"

export interface SettingsTab {
    id: string
    label: string
}

interface SettingsTabsProps {
    tabs: SettingsTab[]
    activeTab: string
    onSelect: (tabId: string) => void
    palette: PaletteTheme
}

export default function SettingsTabs({ tabs, activeTab, onSelect, palette }: SettingsTabsProps) {
    return (
        <div className="sticky top-2 z-20 -mx-1 mb-6 overflow-x-auto overscroll-x-contain px-1 py-2 backdrop-blur-sm sm:top-6 sm:mb-8">
            <div className="inline-flex rounded-full border border-white/15 bg-black/25 p-1 shadow-xl backdrop-blur-xl">
                {tabs.map(tab => {
                    const active = tab.id === activeTab

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onSelect(tab.id)}
                            className={`rounded-full px-5 py-2 text-sm font-black transition ${
                                active
                                    ? `${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}`
                                    : "text-white/60 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
