import { createContext } from "react"

export interface MobileNavigationContextValue {
    hidden: boolean
    setHidden: (hidden: boolean) => void
}

export const MobileNavigationContext = createContext<MobileNavigationContextValue | null>(null)
