import type { ReactNode } from "react"
import LibraryModeSwitcher from "./LibraryModeSwitcher"

interface LibraryPageToolbarProps {
    actions?: ReactNode
    reserveActionsSlot?: boolean
}

export default function LibraryPageToolbar({ actions, reserveActionsSlot = false }: LibraryPageToolbarProps) {
    return (
        <div className="mb-8 flex shrink-0 items-center justify-between gap-4">
            <LibraryModeSwitcher />

            <div
                className={`flex h-12 items-center gap-6 ${reserveActionsSlot ? "invisible pointer-events-none" : ""}`}
                aria-hidden={reserveActionsSlot || undefined}
            >
                {actions ?? <div className="h-12 w-[15rem]" />}
            </div>
        </div>
    )
}
