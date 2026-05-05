import { Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"

import DeckPage from "./Pages/DeckPage"
import CreateDeckPage from "./Pages/CreateDeckPage"
import PlayPage from "./Pages/PlayPage"
import AuthPage from "./Pages/AuthPage"
import ProfileContainer from "./Pages/ProfileContainer"
import ResetPasswordPage from "./Pages/ResetPasswordPage"
import ThemePage from "./Pages/ThemePage"
import ThemedPage from "./components/ThemedPage"

function App() {
    const location = useLocation()
    const isGameplay = location.pathname.includes("/play")

    if (isGameplay) {
        return (
            <Routes location={location}>
                <Route path="/decks/:id/play" element={<PlayPage />} />
            </Routes>
        )
    }

    return (
        <ThemedPage className="px-6 py-8 text-white">
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<DeckPage />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/profile" element={<ProfileContainer />} />
                    <Route path="/theme" element={<ThemePage />} />
                    <Route path="/decks" element={<DeckPage />} />
                    <Route path="/decks/create" element={<CreateDeckPage />} />
                    <Route path="/decks/:id/edit" element={<CreateDeckPage />} />
                </Routes>
            </AnimatePresence>
        </ThemedPage>
    )
}

export default App
