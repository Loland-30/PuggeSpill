import type { ReactNode } from "react"
import LibraryModeSwitcher from "./LibraryModeSwitcher"

interface LibraryPageToolbarProps {
    actions?: ReactNode
    reserveActionsSlot?: boolean
}

export default function LibraryPageToolbar({ actions, reserveActionsSlot = false }: LibraryPageToolbarProps) {
    return (
        <div className="mb-6 flex shrink-0 flex-col items-stretch gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <LibraryModeSwitcher />

            <div
                className={`flex min-h-12 flex-wrap items-center justify-end gap-3 sm:h-12 sm:gap-6 ${reserveActionsSlot ? "invisible pointer-events-none" : ""}`}
                aria-hidden={reserveActionsSlot || undefined}
            >
                {actions ?? <div className="hidden h-12 w-[15rem] sm:block" />}
            </div>
        </div>
    )
}
