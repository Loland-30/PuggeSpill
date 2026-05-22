import { useLocation, useNavigate } from "react-router-dom"
import LibraryViewPicker, { type LibraryView } from "../LibraryViewPicker"

export default function LibraryModeSwitcher() {
    const navigate = useNavigate()
    const location = useLocation()
    const activeView: LibraryView = location.pathname.startsWith("/trials") ? "trials" : "decks"

    const handleChange = (view: LibraryView) => {
        if (view === activeView) return
        navigate(view === "trials" ? "/trials" : "/decks")
    }

    return (
        <LibraryViewPicker
            activeView={activeView}
            onChange={handleChange}
        />
    )
}
