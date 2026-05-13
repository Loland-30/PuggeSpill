import type { Enemy } from "../../hooks/useEnemy"

interface EnemyStageProps {
    enemy: Enemy
    result: "correct" | "incorrect" | null
    hpPercent: number
}

export default function EnemyStage({ enemy, result, hpPercent }: EnemyStageProps) {
    return (
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 text-center">
            <div className="flex w-full max-w-lg flex-col items-center gap-3">
                <p className="text-xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
                    {enemy.enemyName} HP {enemy.hp} / {enemy.maxHp}
                </p>

                <div className="h-3 w-full overflow-hidden rounded-full bg-black/45 shadow-[0_0_18px_rgba(0,0,0,0.35)]">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${
                            enemy.type === "Boss" ? "bg-red-400" :
                            enemy.type === "MiniBoss" ? "bg-purple-400" : "bg-orange-400"
                        }`}
                        style={{ width: `${hpPercent}%` }}
                    />
                </div>
            </div>

            <img
                key={enemy.id}
                src={enemy.imageUrl}
                alt={enemy.enemyName}
                className={`max-h-[23rem] object-contain drop-shadow-[0_0_34px_rgba(255,255,255,0.14)] transition duration-300 ${
                    result === "correct" ? "scale-95 brightness-125" : ""
                }`}
            />
        </section>
    )
}