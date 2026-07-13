import { Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import DeckPage from "./Pages/DeckPage"
import CreateDeckPage from "./Pages/CreateDeckPage"
import PlayPage from "./Pages/PlayPage"
import AuthPage from "./Pages/AuthPage"
import ProfileContainer from "./Pages/ProfileContainer"
import ResetPasswordPage from "./Pages/ResetPasswordPage"
import ThemePage from "./Pages/ThemePage"
import SettingsPage from "./Pages/SettingsPage"
import TrialPage from "./Pages/TrialPage"
import TrialsMenuPage from "./Pages/TrialsMenuPage"
import MultiplayerPage from "./Pages/MultiplayerPage"
import ThemedPage from "./components/ThemedPage"
import AppSideNav from "./components/AppSideNav"
import AppStartupGate from "./components/startup/AppStartupGate"
import MainMenuAudio from "./components/audio/MainMenuAudio"
import { AchievementNotificationProvider } from "./achievements/AchievementNotificationContext"

function App() {
    const location = useLocation()
    const prefersReducedMotion = useReducedMotion()
    const isGameplay = location.pathname.includes("/play") || location.pathname.includes("/trials/")
    const showSideNav = !isGameplay && location.pathname !== "/login" && location.pathname !== "/reset-password"
    const lockPageScroll = location.pathname === "/trials" || location.pathname === "/multiplayer"

    return (
        <AppStartupGate>
            <AchievementNotificationProvider>
                {isGameplay ? (
                <Routes location={location}>
                    <Route path="/decks/:id/play" element={<PlayPage />} />
                    <Route path="/trials/:trialId" element={<TrialPage />} />
                </Routes>
                ) : (
                    <ThemedPage className={`px-4 py-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] text-white sm:px-6 sm:py-8 lg:pb-8 ${lockPageScroll ? "h-dvh overflow-hidden" : ""}`}>
                        <MainMenuAudio />
                        {showSideNav && <AppSideNav />}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                                transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: "easeOut" }}
                                className="relative z-10 min-h-[calc(100dvh-2rem)] w-full sm:min-h-[calc(100dvh-4rem)]"
                            >
                                <Routes location={location}>
                                    <Route path="/" element={<DeckPage />} />
                                    <Route path="/login" element={<AuthPage />} />
                                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                                    <Route path="/profile" element={<ProfileContainer />} />
                                    <Route path="/profile/:userId" element={<ProfileContainer />} />
                                    <Route path="/theme" element={<ThemePage />} />
                                    <Route path="/settings" element={<SettingsPage />} />
                                    <Route path="/multiplayer" element={<MultiplayerPage />} />
                                    <Route path="/trials" element={<TrialsMenuPage />} />
                                    <Route path="/decks" element={<DeckPage />} />
                                    <Route path="/decks/create" element={<CreateDeckPage />} />
                                    <Route path="/decks/:id/edit" element={<CreateDeckPage />} />
                                </Routes>
                            </motion.div>
                        </AnimatePresence>
                    </ThemedPage>
                )}
            </AchievementNotificationProvider>
        </AppStartupGate>
    )
}

export default App
