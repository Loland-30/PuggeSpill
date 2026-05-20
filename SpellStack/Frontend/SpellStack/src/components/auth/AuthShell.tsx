import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"
import AuthTabs from "./AuthTabs"

interface AuthShellProps {
    mode: "login" | "signup"
    onModeChange: (mode: "login" | "signup") => void
    children: ReactNode
}

const starPoints = [
    { top: "8%", left: "7%", size: 1, opacity: 0.38 },
    { top: "12%", left: "27%", size: 2, opacity: 0.5 },
    { top: "17%", left: "63%", size: 1, opacity: 0.42 },
    { top: "21%", left: "82%", size: 2, opacity: 0.34 },
    { top: "28%", left: "14%", size: 1, opacity: 0.44 },
    { top: "33%", left: "52%", size: 2, opacity: 0.52 },
    { top: "39%", left: "73%", size: 1, opacity: 0.36 },
    { top: "45%", left: "18%", size: 2, opacity: 0.32 },
    { top: "51%", left: "88%", size: 1, opacity: 0.48 },
    { top: "57%", left: "34%", size: 1, opacity: 0.38 },
    { top: "62%", left: "67%", size: 2, opacity: 0.45 },
    { top: "69%", left: "11%", size: 1, opacity: 0.32 },
    { top: "74%", left: "48%", size: 1, opacity: 0.5 },
    { top: "79%", left: "79%", size: 2, opacity: 0.3 },
    { top: "86%", left: "24%", size: 1, opacity: 0.34 },
    { top: "91%", left: "59%", size: 1, opacity: 0.42 }
]

const shootingStars = [
    { top: "7%", left: "86%", length: 118, delay: 0.2, duration: 3.8, opacity: 0.72 },
    { top: "15%", left: "72%", length: 86, delay: 3.8, duration: 4.4, opacity: 0.5 },
    { top: "23%", left: "95%", length: 132, delay: 7.3, duration: 4.1, opacity: 0.64 },
    { top: "34%", left: "79%", length: 74, delay: 10.6, duration: 5.2, opacity: 0.42 },
    { top: "43%", left: "91%", length: 102, delay: 14.5, duration: 4.6, opacity: 0.58 },
    { top: "10%", left: "58%", length: 68, delay: 18.1, duration: 5.4, opacity: 0.36 },
    { top: "29%", left: "66%", length: 120, delay: 21.4, duration: 4.8, opacity: 0.56 },
    { top: "4%", left: "98%", length: 94, delay: 25.8, duration: 4.2, opacity: 0.48 },
    { top: "53%", left: "84%", length: 82, delay: 29.2, duration: 5.7, opacity: 0.34 },
    { top: "18%", left: "89%", length: 110, delay: 33.6, duration: 4.5, opacity: 0.54 },
    { top: "38%", left: "62%", length: 72, delay: 37.8, duration: 5.8, opacity: 0.32 },
    { top: "26%", left: "100%", length: 146, delay: 42.4, duration: 4.9, opacity: 0.62 }
]

function AuthBackground() {
    const reduceMotion = useReducedMotion()

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_82%,rgba(72,190,232,0.32),transparent_24%),radial-gradient(circle_at_44%_63%,rgba(145,83,211,0.22),transparent_20%),radial-gradient(circle_at_90%_16%,rgba(32,118,206,0.13),transparent_24%),linear-gradient(180deg,#030610_0%,#050716_50%,#021426_100%)]"
                animate={reduceMotion ? undefined : { scale: [1, 1.025, 1], filter: ["hue-rotate(0deg)", "hue-rotate(7deg)", "hue-rotate(0deg)"] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_26%,rgba(255,255,255,0.12)_0_1px,transparent_2px),radial-gradient(circle_at_72%_18%,rgba(163,213,255,0.18)_0_1px,transparent_2px),radial-gradient(circle_at_58%_72%,rgba(255,255,255,0.10)_0_1px,transparent_2px),radial-gradient(circle_at_86%_62%,rgba(116,205,255,0.14)_0_1px,transparent_2px)] [background-repeat:no-repeat]" />
            {starPoints.map((star, index) => (
                <motion.span
                    key={index}
                    className="absolute rounded-full bg-white shadow-[0_0_9px_rgba(190,226,255,0.7)]"
                    style={{ top: star.top, left: star.left, width: star.size, height: star.size, opacity: star.opacity }}
                    animate={reduceMotion ? undefined : { opacity: [star.opacity * 0.55, star.opacity, star.opacity * 0.7] }}
                    transition={{ duration: 3.4 + (index % 4), repeat: Infinity, ease: "easeInOut", delay: index * 0.18 }}
                />
            ))}
            {!reduceMotion && shootingStars.map((star, index) => (
                <motion.span
                    key={index}
                    className="absolute h-px origin-left -rotate-45 rounded-full bg-gradient-to-r from-cyan-100 via-sky-300/80 to-transparent shadow-[0_0_12px_rgba(125,211,252,0.75)]"
                    style={{ top: star.top, left: star.left, width: star.length, opacity: 0 }}
                    animate={{ x: [0, -520], y: [0, 520], opacity: [0, star.opacity, 0] }}
                    transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, repeatDelay: 24, ease: "easeOut" }}
                />
            ))}
            <motion.div
                className="absolute -left-[18%] bottom-[-8rem] h-80 w-[82%] rounded-[100%] bg-cyan-300/24 blur-3xl"
                animate={reduceMotion ? undefined : { x: [0, 54, 0], y: [0, -18, 0], opacity: [0.2, 0.34, 0.2] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-20 left-[22%] h-64 w-[42%] -rotate-12 rounded-[100%] bg-fuchsia-300/14 blur-3xl"
                animate={reduceMotion ? undefined : { x: [0, -34, 0], y: [0, 26, 0], opacity: [0.1, 0.22, 0.1] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-black/64 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-slate-950 via-slate-950/58 to-transparent" />
        </div>
    )
}

export default function AuthShell({ mode, onModeChange, children }: AuthShellProps) {
    return (
        <div className="fixed inset-0 overflow-y-auto bg-[#030610] text-white">
            <AuthBackground />
            <div className="relative z-10 flex min-h-screen flex-col px-6 py-9">
                <AuthTabs mode={mode} onModeChange={onModeChange} />
                <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center pb-12 pt-10">
                    {children}
                </main>
            </div>
        </div>
    )
}
