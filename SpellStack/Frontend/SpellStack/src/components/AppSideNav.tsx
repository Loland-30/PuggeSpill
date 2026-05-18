import type { ComponentType } from "react"
import { FolderOpen, LogOut, Palette, Settings, UserRound } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"

interface NavItem {
    label: string
    path: string
    icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
    match: (pathname: string) => boolean
}

export default function AppSideNav() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logoutUser, profileImage } = useAuth()
    const { t } = useI18n()
    const { palette } = useTheme()

    const navItems: NavItem[] = [
        {
            label: t.nav.decks,
            path: "/decks",
            icon: FolderOpen,
            match: pathname => pathname === "/" || pathname.startsWith("/decks")
        },
        {
            label: t.nav.themes,
            path: "/theme",
            icon: Palette,
            match: pathname => pathname.startsWith("/theme")
        },
        {
            label: t.nav.settings,
            path: "/settings",
            icon: Settings,
            match: pathname => pathname.startsWith("/settings")
        }
    ]

    const handleLogout = async () => {
        await logoutUser()
        navigate("/login")
    }

    return (
        <aside className="fixed left-8 top-8 z-40 hidden h-[calc(100vh-4rem)] w-44 flex-col text-white lg:flex">
            <button
                type="button"
                onClick={() => navigate(user ? "/profile" : "/login")}
                className="group relative grid h-14 w-14 place-items-center overflow-visible rounded-full text-xl font-black transition hover:scale-105"
                aria-label={t.nav.openProfile}
            >
                <span className={`absolute inset-0 rounded-full border-2 ${palette.border} ${profileImage ? "bg-slate-900" : palette.primaryButton} ${palette.glow}`} />
                <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full">
                    {profileImage ? (
                        <img
                            src={profileImage}
                            alt={user ? `${user.username} profile` : t.nav.openProfile}
                            className="h-full w-full object-cover"
                        />
                    ) : user ? (
                        user.username.slice(0, 1).toUpperCase()
                    ) : (
                        <UserRound size={24} strokeWidth={2.5} />
                    )}
                </span>
                {user && (
                    <span className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-bold text-white opacity-0 drop-shadow-lg transition group-hover:translate-x-1 group-hover:opacity-100">
                        {user.username}
                    </span>
                )}
            </button>

            <nav className="mt-auto flex flex-col gap-5 pb-28">
                {navItems.map(item => {
                    const Icon = item.icon
                    const active = item.match(location.pathname)

                    return (
                        <button
                            key={item.path}
                            type="button"
                            onClick={() => navigate(item.path)}
                            className="group flex items-center gap-3 text-left text-lg font-medium text-white transition"
                        >
                            <span className={`h-7 w-1 rounded-full transition-all duration-200 ${active ? palette.primaryButton : "bg-transparent"}`} />
                            <Icon
                                size={20}
                                strokeWidth={2.5}
                                className="-ml-2 opacity-0 transition-all duration-200 group-hover:ml-0 group-hover:opacity-100"
                            />
                            <span className={`transition-all duration-200 group-hover:translate-x-1 ${active ? "text-white" : "text-white/85 group-hover:text-white"}`}>
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </nav>

            <button
                type="button"
                onClick={handleLogout}
                className="group mt-auto flex items-center gap-3 pb-8 text-left text-lg font-medium text-white/85 transition hover:text-white"
            >
                <LogOut
                    size={20}
                    strokeWidth={2.5}
                    className="opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                />
                <span className="transition-transform duration-200 group-hover:translate-x-1">{t.nav.signOut}</span>
            </button>
        </aside>
    )
}