import { Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"

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
import ThemedPage from "./components/ThemedPage"
import AppSideNav from "./components/AppSideNav"

function App() {
    const location = useLocation()
    const isGameplay = location.pathname.includes("/play") || location.pathname.includes("/trials/")
    const showSideNav = !isGameplay && location.pathname !== "/login" && location.pathname !== "/reset-password"

    if (isGameplay) {
        return (
            <Routes location={location}>
                <Route path="/decks/:id/play" element={<PlayPage />} />
                <Route path="/trials/:trialId" element={<TrialPage />} />
            </Routes>
        )
    }

    return (
        <ThemedPage className="px-6 py-8 text-white">
            {showSideNav && <AppSideNav />}
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<DeckPage />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/profile" element={<ProfileContainer />} />
                    <Route path="/theme" element={<ThemePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/trials" element={<TrialsMenuPage />} />
                    <Route path="/decks" element={<DeckPage />} />
                    <Route path="/decks/create" element={<CreateDeckPage />} />
                    <Route path="/decks/:id/edit" element={<CreateDeckPage />} />
                </Routes>
            </AnimatePresence>
        </ThemedPage>
    )
}

export default App
