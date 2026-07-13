import { useContext } from "react"
import { MobileNavigationContext } from "./mobileNavigationContext"

export default function useMobileNavigation() {
    const context = useContext(MobileNavigationContext)

    if (!context) {
        throw new Error("useMobileNavigation must be used inside MobileNavigationProvider")
    }

    return context
}
