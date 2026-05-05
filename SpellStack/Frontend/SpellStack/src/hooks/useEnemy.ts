import { useState } from "react"
import { listOfEnemies } from "../data/enemies"

export type EnemyType = "Common" | "MiniBoss" | "Boss"

export interface Enemy {
    id: number
    enemyName: string
    imageUrl: string
    type: EnemyType
    hp: number
    maxHp: number
}

function getEnemyType(enemiesKilled: number): EnemyType {
    const nextCount = enemiesKilled + 1
    if (nextCount % 15 === 0) return "Boss"
    if (nextCount % 5 === 0) return "MiniBoss"
    return "Common"
}

function getEnemyHp(baseHp: number, type: EnemyType) {
    if (type === "Boss") return baseHp + 8
    if (type === "MiniBoss") return baseHp + 4
    return baseHp
}

function createEnemy(type: EnemyType = "Common", excludedId?: number): Enemy {
    const pool = excludedId
        ? listOfEnemies.filter(enemy => enemy.id !== excludedId)
        : listOfEnemies
    const next = pool[Math.floor(Math.random() * pool.length)]
    const maxHp = getEnemyHp(next.baseHp, type)

    return { ...next, type, hp: maxHp, maxHp }
}

export function useEnemy() {
    const [currentEnemy, setCurrentEnemy] = useState<Enemy>(() => createEnemy())
    const [enemiesKilled, setEnemiesKilled] = useState(0)
    const [streak, setStreak] = useState(0)
    const [usedEnemyIds, setUsedEnemyIds] = useState<number[]>([])

    const spawnNextEnemy = (killed: number, currentId: number) => {
        const type = getEnemyType(killed)
        const available = listOfEnemies.filter(e => !usedEnemyIds.includes(e.id) && e.id !== currentId)
        const pool = available.length > 0 ? available : listOfEnemies.filter(e => e.id !== currentId)
        const next = pool[Math.floor(Math.random() * pool.length)]
        const maxHp = getEnemyHp(next.baseHp, type)

        setUsedEnemyIds(prev =>
            available.length > 0 ? [...prev, next.id] : [next.id]
        )
        setCurrentEnemy({ ...next, type, hp: maxHp, maxHp })
    }

    const onCorrectAnswer = () => {
        const newStreak = streak + 1
        const damage = 1
        const nextHp = Math.max(0, currentEnemy.hp - damage)

        if (nextHp <= 0) {
            const newEnemiesKilled = enemiesKilled + 1
            setEnemiesKilled(newEnemiesKilled)
            setStreak(newStreak)
            spawnNextEnemy(newEnemiesKilled, currentEnemy.id)
        } else {
            setStreak(newStreak)
            setCurrentEnemy(prev => ({ ...prev, hp: nextHp }))
        }
    }

    const onWrongAnswer = () => {
        setStreak(0)
    }

    const resetEnemyRun = () => {
        setCurrentEnemy(createEnemy())
        setEnemiesKilled(0)
        setStreak(0)
        setUsedEnemyIds([])
    }

    return {
        currentEnemy,
        streak,
        enemiesKilled,
        onCorrectAnswer,
        onWrongAnswer,
        resetEnemyRun
    }
}
