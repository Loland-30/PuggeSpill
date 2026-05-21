import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogIn, LogOut, Palette, UserRound } from "lucide-react"

import { useAuth } from "../auth/AuthContext"
import { useTheme } from "../theme/ThemeContext"
import ProfileImage from "./ProfileImage"

export default function ProfileDropdown() {
    const navigate = useNavigate()
    const { user, logoutUser, profileImage } = useAuth()
    const { palette } = useTheme()
    const [profileMenuOpen, setProfileMenuOpen] = useState(false)

    const handleLogout = async () => {
        await logoutUser()
        setProfileMenuOpen(false)
        navigate("/login")
    }

    return (
        <div className="relative">
            <button
                onClick={() => setProfileMenuOpen(open => !open)}
                className={`relative grid h-14 w-14 place-items-center overflow-hidden rounded-full border-2 ${palette.border} ${profileImage ? "bg-slate-900 text-white" : `${palette.primaryButton} ${palette.primaryButtonText}`} text-xl font-black ${palette.glow} transition hover:scale-105`}
                aria-label="Open profile menu"
            >
                {user ? (
                    user.username.slice(0, 1).toUpperCase()
                ) : (
                    <UserRound size={24} strokeWidth={2.5} />
                )}
                <ProfileImage
                    src={profileImage}
                    alt={user ? `${user.username} profile` : "Profile"}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </button>

            {profileMenuOpen && (
                <div className={`absolute right-0 top-16 z-50 w-44 overflow-hidden rounded-lg border ${palette.border} ${palette.card} ${palette.glow} py-2 backdrop-blur-xl`}>
                    <button
                        onClick={() => navigate(user ? "/profile" : "/login")}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                        <UserRound size={17} strokeWidth={2.25} />
                        Profile
                    </button>

                    <button
                        onClick={() => navigate("/theme")}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                        <Palette size={17} strokeWidth={2.25} />
                        Theme
                    </button>

                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                            <LogOut size={17} strokeWidth={2.25} />
                            Log out
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate("/login")}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                            <LogIn size={17} strokeWidth={2.25} />
                            Log in
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
