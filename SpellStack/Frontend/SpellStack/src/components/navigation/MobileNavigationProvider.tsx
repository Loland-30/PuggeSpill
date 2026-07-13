import { useMemo, useState, type ReactNode } from "react"
import { MobileNavigationContext } from "./mobileNavigationContext"

export default function MobileNavigationProvider({ children }: { children: ReactNode }) {
    const [hidden, setHidden] = useState(false)
    const value = useMemo(() => ({ hidden, setHidden }), [hidden])

    return (
        <MobileNavigationContext.Provider value={value}>
            {children}
        </MobileNavigationContext.Provider>
    )
}
