import type { CSSProperties } from "react"

const staticStars = [
    { top: "6%", left: "12%", size: 1, opacity: 0.3 },
    { top: "9%", left: "38%", size: 2, opacity: 0.42 },
    { top: "13%", left: "71%", size: 1, opacity: 0.34 },
    { top: "18%", left: "89%", size: 2, opacity: 0.28 },
    { top: "24%", left: "22%", size: 1, opacity: 0.38 },
    { top: "29%", left: "55%", size: 2, opacity: 0.46 },
    { top: "34%", left: "80%", size: 1, opacity: 0.32 },
    { top: "41%", left: "7%", size: 2, opacity: 0.26 },
    { top: "46%", left: "44%", size: 1, opacity: 0.36 },
    { top: "52%", left: "68%", size: 2, opacity: 0.34 },
    { top: "57%", left: "93%", size: 1, opacity: 0.28 },
    { top: "63%", left: "29%", size: 1, opacity: 0.42 },
    { top: "70%", left: "51%", size: 2, opacity: 0.3 },
    { top: "76%", left: "77%", size: 1, opacity: 0.36 },
    { top: "83%", left: "17%", size: 2, opacity: 0.24 },
    { top: "88%", left: "62%", size: 1, opacity: 0.34 },
    { top: "92%", left: "86%", size: 1, opacity: 0.28 },
    { top: "15%", left: "5%", size: 1, opacity: 0.25 },
    { top: "67%", left: "4%", size: 1, opacity: 0.27 },
    { top: "37%", left: "97%", size: 1, opacity: 0.3 }
]

const shootingStars = [
    { top: "-8%", left: "96%", delay: "0s", duration: "5.8s", length: 140, opacity: 0.82 },
    { top: "4%", left: "82%", delay: "1.6s", duration: "6.4s", length: 110, opacity: 0.62 },
    { top: "16%", left: "105%", delay: "3.2s", duration: "5.2s", length: 170, opacity: 0.78 },
    { top: "28%", left: "92%", delay: "5.4s", duration: "7s", length: 95, opacity: 0.52 },
    { top: "42%", left: "100%", delay: "8.1s", duration: "6.2s", length: 130, opacity: 0.68 },
    { top: "8%", left: "114%", delay: "11.8s", duration: "6.8s", length: 155, opacity: 0.58 },
    { top: "20%", left: "88%", delay: "15.2s", duration: "7.4s", length: 84, opacity: 0.44 },
    { top: "35%", left: "108%", delay: "19.1s", duration: "5.9s", length: 145, opacity: 0.7 },
    { top: "52%", left: "94%", delay: "23.6s", duration: "7.2s", length: 105, opacity: 0.48 },
    { top: "-2%", left: "72%", delay: "28.4s", duration: "6.6s", length: 122, opacity: 0.5 },
    { top: "12%", left: "124%", delay: "32.5s", duration: "5.6s", length: 176, opacity: 0.76 },
    { top: "31%", left: "78%", delay: "37.7s", duration: "8s", length: 92, opacity: 0.38 },
    { top: "47%", left: "116%", delay: "43.3s", duration: "6.1s", length: 138, opacity: 0.56 },
    { top: "-12%", left: "86%", delay: "49.8s", duration: "7.6s", length: 118, opacity: 0.45 },
    { top: "24%", left: "118%", delay: "55.1s", duration: "6.9s", length: 164, opacity: 0.64 },
    { top: "58%", left: "102%", delay: "61.4s", duration: "7.8s", length: 98, opacity: 0.36 }
]

export default function AuthStarfallBackground() {
    return (
        <div className="auth-starfall-background" aria-hidden="true">
            <div className="auth-starfall-nebula" />
            <div className="auth-starfall-stars">
                {staticStars.map((star, index) => (
                    <span
                        key={index}
                        className="auth-static-star"
                        style={{
                            top: star.top,
                            left: star.left,
                            width: star.size,
                            height: star.size,
                            opacity: star.opacity
                        }}
                    />
                ))}
            </div>
            <div className="auth-starfall-meteors">
                {shootingStars.map((star, index) => (
                    <span
                        key={index}
                        className="auth-shooting-star"
                        style={{
                            top: star.top,
                            left: star.left,
                            "--delay": star.delay,
                            "--duration": star.duration,
                            "--length": `${star.length}px`,
                            "--opacity": star.opacity
                        } as CSSProperties}
                    >
                        <span className="auth-shooting-star__trail" />
                    </span>
                ))}
            </div>
            <div className="auth-starfall-shade" />
            <style>{`
                .auth-starfall-background {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    pointer-events: none;
                    background:
                        radial-gradient(circle at 50% 80%, rgba(91, 33, 182, 0.28), transparent 34%),
                        radial-gradient(circle at 18% 88%, rgba(14, 165, 233, 0.25), transparent 31%),
                        radial-gradient(circle at 92% 22%, rgba(14, 116, 144, 0.14), transparent 28%),
                        linear-gradient(180deg, #020617 0%, #050816 45%, #071426 100%);
                }

                .auth-starfall-background::after {
                    content: "";
                    position: absolute;
                    inset: auto 0 0 0;
                    height: 38%;
                    background: linear-gradient(to top, rgba(14, 116, 144, 0.26), transparent);
                    pointer-events: none;
                }

                .auth-starfall-nebula {
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(ellipse at 48% 74%, rgba(147, 51, 234, 0.2), transparent 24%),
                        radial-gradient(ellipse at 34% 86%, rgba(56, 189, 248, 0.2), transparent 30%),
                        radial-gradient(ellipse at 76% 70%, rgba(37, 99, 235, 0.12), transparent 28%);
                    filter: blur(2px);
                    opacity: 0.92;
                    animation: auth-nebula-breathe 18s ease-in-out infinite;
                }

                .auth-starfall-stars,
                .auth-starfall-meteors,
                .auth-starfall-shade {
                    position: absolute;
                    inset: 0;
                }

                .auth-static-star {
                    position: absolute;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.9);
                    box-shadow: 0 0 8px rgba(186, 230, 253, 0.52);
                    animation: auth-star-twinkle 5.5s ease-in-out infinite;
                }

                .auth-static-star:nth-child(3n) { animation-delay: 1.2s; }
                .auth-static-star:nth-child(4n) { animation-delay: 2.4s; }
                .auth-static-star:nth-child(5n) { animation-delay: 3.1s; }

                .auth-shooting-star {
                    position: absolute;
                    width: 0;
                    height: 0;
                    opacity: 0;
                    transform: translate3d(0, 0, 0);
                    animation: auth-meteor-fall var(--duration) linear infinite;
                    animation-delay: var(--delay);
                    will-change: transform, opacity;
                }

                .auth-shooting-star__trail {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: var(--length);
                    height: 2px;
                    border-radius: 999px;
                    background: linear-gradient(
                        90deg,
                        rgba(186, 230, 253, 0.98),
                        rgba(125, 211, 252, 0.58) 28%,
                        rgba(103, 232, 249, 0.12) 68%,
                        rgba(103, 232, 249, 0)
                    );
                    filter: drop-shadow(0 0 7px rgba(56, 189, 248, 0.72));
                    transform: rotate(-35deg) translate3d(0, 0, 0);
                    transform-origin: left center;
                }

                .auth-shooting-star__trail::after {
                    content: "";
                    position: absolute;
                    left: 0;
                    top: 50%;
                    width: 5px;
                    height: 5px;
                    border-radius: 999px;
                    background: rgba(224, 242, 254, 0.96);
                    box-shadow:
                        0 0 8px rgba(125, 211, 252, 0.9),
                        0 0 18px rgba(56, 189, 248, 0.55);
                    transform: translateY(-50%);
                }

                .auth-starfall-shade {
                    background: rgba(0, 0, 0, 0.14);
                }

                @keyframes auth-meteor-fall {
                    0% {
                        opacity: 0;
                        transform: translate3d(0, 0, 0);
                    }
                    7% {
                        opacity: var(--opacity);
                    }
                    58% {
                        opacity: calc(var(--opacity) * 0.9);
                    }
                    100% {
                        opacity: 0;
                        transform: translate3d(-74vw, 58vh, 0);
                    }
                }

                @keyframes auth-nebula-breathe {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.78;
                    }
                    50% {
                        transform: scale(1.035);
                        opacity: 1;
                    }
                }

                @keyframes auth-star-twinkle {
                    0%, 100% { opacity: 0.42; }
                    50% { opacity: 0.92; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .auth-starfall-nebula,
                    .auth-static-star,
                    .auth-shooting-star {
                        animation: none;
                    }

                    .auth-shooting-star {
                        opacity: 0.16;
                    }
                }
            `}</style>
        </div>
    )
}
