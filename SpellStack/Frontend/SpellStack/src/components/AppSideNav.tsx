import type { ComponentType, MouseEventHandler } from "react"
import { FolderOpen, LogOut, Newspaper, Palette, Settings, UserRound } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { useUISound } from "../audio/useUISound"
import { useAuth } from "../auth/AuthContext"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"
import ProfileImage from "./ProfileImage"
import useMobileNavigation from "./navigation/useMobileNavigation"

interface NavItem {
    label: string
    path: string
    icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
    match: (pathname: string) => boolean
}

interface NavItemLinkProps {
    item: NavItem
    active: boolean
    activeIndicatorClass: string
    onHover: MouseEventHandler<HTMLElement>
}

function NavItemLink({ item, active, activeIndicatorClass, onHover }: NavItemLinkProps) {
    const navigate = useNavigate()
    const Icon = item.icon

    return (
        <div
            role="link"
            tabIndex={0}
            aria-current={active ? "page" : undefined}
            onMouseEnter={active ? undefined : onHover}
            onClick={() => navigate(item.path)}
            onKeyDown={event => {
                if (event.key !== "Enter" && event.key !== " ") return
                event.preventDefault()
                navigate(item.path)
            }}
            className="group -my-3 flex w-full cursor-default items-center gap-3 rounded-lg py-4 pr-5 text-left text-lg font-medium text-white outline-none transition focus-visible:ring-2 focus-visible:ring-white/55"
        >
            <span
                aria-hidden="true"
                className={`pointer-events-none h-7 w-1 rounded-full transition-all duration-200 ${active ? activeIndicatorClass : "bg-transparent"}`}
            />
            <Icon
                size={20}
                strokeWidth={2.5}
                aria-hidden="true"
                className="pointer-events-none -ml-2 opacity-0 transition-all duration-200 group-hover:ml-0 group-hover:opacity-100 group-focus-visible:ml-0 group-focus-visible:opacity-100"
            />
            <span className={`pointer-events-none transition-all duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1 ${active ? "text-white" : "text-white/85 group-hover:text-white group-focus-visible:text-white"}`}>
                {item.label}
            </span>
        </div>
    )
}

export default function AppSideNav() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logoutUser, profileImage } = useAuth()
    const { t } = useI18n()
    const { palette } = useTheme()
    const { playHoverSound } = useUISound()
    const { hidden: mobileNavigationHidden } = useMobileNavigation()

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
            label: t.nav.updates,
            path: "/updates",
            icon: Newspaper,
            match: pathname => pathname.startsWith("/updates")
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
        <>
        <aside className="fixed left-8 top-8 z-40 hidden h-[calc(100dvh-4rem)] w-44 flex-col text-white min-[1400px]:flex">
            <button
                type="button"
                onClick={() => navigate(user ? "/profile" : "/login")}
                onMouseEnter={playHoverSound}
                className="group relative grid h-14 w-14 place-items-center overflow-visible rounded-full text-xl font-black transition hover:scale-105"
                aria-label={t.nav.openProfile}
            >
                <span className={`absolute inset-0 rounded-full border-2 ${palette.border} ${profileImage ? "bg-slate-900" : palette.primaryButton} ${palette.glow}`} />
                <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full">
                    {user ? (
                        user.username.slice(0, 1).toUpperCase()
                    ) : (
                        <UserRound size={24} strokeWidth={2.5} />
                    )}
                    <ProfileImage
                        src={profileImage}
                        alt={user ? `${user.username} profile` : t.nav.openProfile}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                </span>
                {user && (
                    <span className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-bold text-white opacity-0 drop-shadow-lg transition group-hover:translate-x-1 group-hover:opacity-100">
                        {user.username}
                    </span>
                )}
            </button>

            <nav className="mt-auto flex flex-col gap-5 pb-28">
                {navItems.map(item => (
                    <NavItemLink
                        key={item.path}
                        item={item}
                        active={item.match(location.pathname)}
                        activeIndicatorClass={palette.primaryButton}
                        onHover={playHoverSound}
                    />
                ))}
            </nav>

            <button
                type="button"
                onClick={handleLogout}
                onMouseEnter={playHoverSound}
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

        {!mobileNavigationHidden && <nav
            aria-label="Main navigation"
            className="pointer-events-none fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 z-40 grid w-[min(calc(100vw-1rem),24rem)] -translate-x-1/2 grid-cols-5 items-center gap-1 rounded-2xl border border-white/15 bg-slate-950/80 px-2 py-1 text-white shadow-2xl backdrop-blur-xl min-[1400px]:hidden"
        >
            {navItems.map(item => {
                const active = item.match(location.pathname)
                const Icon = item.icon

                return (
                    <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        aria-label={item.label}
                        aria-current={active ? "page" : undefined}
                        className={`pointer-events-auto relative flex min-h-11 min-w-0 items-center justify-center bg-transparent text-white/70 outline-none transition focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-white/70 ${active ? "text-cyan-100" : ""}`}
                    >
                        {active && <span aria-hidden="true" className={`absolute left-1/2 top-0 h-0.5 w-6 -translate-x-1/2 rounded-full ${palette.primaryButton}`} />}
                        <span className={`grid h-11 w-11 place-items-center rounded-full bg-transparent transition ${active ? "text-cyan-100" : "drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]"}`}>
                            <Icon size={21} strokeWidth={2.5} aria-hidden="true" />
                        </span>
                        <span className="sr-only">{item.label}</span>
                    </button>
                )
            })}

            <button
                type="button"
                onClick={() => navigate(user ? "/profile" : "/login")}
                aria-label={t.nav.openProfile}
                aria-current={location.pathname.startsWith("/profile") ? "page" : undefined}
                className="pointer-events-auto relative grid min-h-11 place-items-center bg-transparent outline-none focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-white/70"
            >
                {location.pathname.startsWith("/profile") && (
                    <span aria-hidden="true" className={`absolute left-1/2 top-0 h-0.5 w-6 -translate-x-1/2 rounded-full ${palette.primaryButton}`} />
                )}
                <span className={`relative grid h-[2.625rem] w-[2.625rem] place-items-center overflow-hidden rounded-full border ${palette.border} ${profileImage ? "bg-slate-900" : palette.primaryButton} text-sm font-black transition sm:h-9 sm:w-9 ${location.pathname.startsWith("/profile") ? "shadow-none" : "drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]"}`}>
                    {user ? user.username.slice(0, 1).toUpperCase() : <UserRound size={19} strokeWidth={2.5} />}
                    <ProfileImage
                        src={profileImage}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                </span>
            </button>

        </nav>}
        </>
    )
}
