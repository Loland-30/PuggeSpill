import { memo } from "react"
import playerSpriteUrl from "../../assets/player/idle.png"
import type { ActiveEnemy } from "../../data/enemies/enemyTypes"

interface EnemyStageProps {
    enemy: ActiveEnemy
    result: "correct" | "incorrect" | null
    hpPercent: number
    enemyVisualState?: "idle" | "hurt" | "death"
}

function EnemyStage({
    enemy,
    result,
    hpPercent,
    enemyVisualState = result === "correct" ? "hurt" : "idle"
}: EnemyStageProps) {
    const enemyImageUrl = enemyVisualState === "death"
        ? enemy.deathImageUrl ?? enemy.injuredImageUrl ?? enemy.imageUrl
        : enemyVisualState === "hurt"
            ? enemy.injuredImageUrl ?? enemy.deathImageUrl ?? enemy.imageUrl
            : enemy.imageUrl

    return (
        <section className="relative mx-auto flex min-h-[22rem] w-full max-w-7xl flex-1 items-end justify-center px-0 pb-20 pt-20 sm:min-h-[34rem] sm:px-4 sm:pb-24 sm:pt-16 md:min-h-[38rem] lg:min-h-[42rem] landscape:max-sm:min-h-[15rem] landscape:max-sm:pb-16 landscape:max-sm:pt-8">
            <div className="grid w-full grid-cols-1 items-end sm:grid-cols-[minmax(8rem,0.9fr)_minmax(3rem,0.45fr)_minmax(8rem,0.9fr)] sm:gap-4 md:gap-8 lg:gap-16">
                <div className="hidden min-w-0 justify-center sm:flex md:justify-end">
                    <img
                        src={playerSpriteUrl}
                        alt="Player"
                        className={`h-[11rem] max-w-full object-contain drop-shadow-[0_20px_28px_rgba(0,0,0,0.45)] transition duration-150 ease-out min-[400px]:h-[14rem] sm:h-[25rem] lg:h-[28rem] landscape:max-sm:h-[9rem] ${
                            result === "correct" ? "translate-x-4 scale-105 sm:translate-x-16 sm:scale-110" :
                            result === "incorrect" ? "-translate-x-2 brightness-125 saturate-150" : ""
                        }`}
                    />
                </div>

                <div aria-hidden="true" className="hidden min-h-24 sm:block" />

                <div className="relative flex min-w-0 justify-center md:justify-start">
                    <div className="absolute -top-14 left-1/2 z-10 w-[min(18rem,82vw)] -translate-x-1/2 text-white sm:-top-16 sm:w-72 md:left-10 md:translate-x-0 lg:-top-20">
                        <div className="flex items-end justify-between gap-2 text-sm font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)] sm:gap-3 sm:text-2xl">
                            <span className="truncate">{enemy.name}</span>
                            <span className="shrink-0">{enemy.hp} / {enemy.maxHp}</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/35 shadow-[0_0_18px_rgba(0,0,0,0.45)]">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                    enemy.enemyType === "boss" ? "bg-red-300" :
                                    enemy.enemyType === "miniBoss" ? "bg-purple-300" : "bg-white"
                                }`}
                                style={{ width: `${hpPercent}%` }}
                            />
                        </div>
                    </div>

                    <div className="relative scale-x-[-1]">
                        <img
                            key={`${enemy.id}-${enemyVisualState}`}
                            src={enemyImageUrl}
                            alt={enemy.name}
                            className={`h-[clamp(14rem,42dvh,22rem)] max-w-full object-contain drop-shadow-[0_20px_28px_rgba(0,0,0,0.45)] transition duration-300 sm:h-[25rem] lg:h-[28rem] landscape:max-sm:h-[10rem] ${
                                enemyVisualState === "hurt" ? "scale-95 brightness-125 saturate-150 drop-shadow-[0_0_34px_rgba(248,113,113,0.55)]" :
                                enemyVisualState === "death" ? "scale-95 opacity-80 grayscale" : ""
                            }`}
                            style={enemyVisualState === "hurt" ? { filter: "sepia(0.45) saturate(2.1) hue-rotate(310deg) brightness(1.1)" } : undefined}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default memo(EnemyStage)
