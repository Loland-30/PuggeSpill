import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

interface MobileNavigationContextValue {
    hidden: boolean
    setHidden: (hidden: boolean) => void
}

const MobileNavigationContext = createContext<MobileNavigationContextValue | null>(null)

export function MobileNavigationProvider({ children }: { children: ReactNode }) {
    const [hidden, setHidden] = useState(false)
    const value = useMemo(() => ({ hidden, setHidden }), [hidden])

    return (
        <MobileNavigationContext.Provider value={value}>
            {children}
        </MobileNavigationContext.Provider>
    )
}

export function useMobileNavigation() {
    const context = useContext(MobileNavigationContext)

    if (!context) {
        throw new Error("useMobileNavigation must be used inside MobileNavigationProvider")
    }

    return context
}
