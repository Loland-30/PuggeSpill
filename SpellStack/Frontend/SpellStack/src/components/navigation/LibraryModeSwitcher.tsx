import { useLocation, useNavigate } from "react-router-dom"
import LibraryViewPicker, { type LibraryView } from "../LibraryViewPicker"

export default function LibraryModeSwitcher() {
    const navigate = useNavigate()
    const location = useLocation()
    const activeView: LibraryView = location.pathname.startsWith("/multiplayer")
            ? "multiplayer"
            : "decks"

    const handleChange = (view: LibraryView) => {
        if (view === activeView) return
        if (view === "multiplayer") navigate("/multiplayer")
        else navigate("/decks")
    }

    return (
        <LibraryViewPicker
            activeView={activeView}
            onChange={handleChange}
        />
    )
}
