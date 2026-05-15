import demonGirlEnemy from "../../assets/enemies/demonGirlEnemy.png"
import pheonixEnemy from "../../assets/enemies/pheonixEnemy.png"
import skeletonEnemy from "../../assets/enemies/skeletonEnemy.png"
import type { EnemyDefinition } from "./enemyTypes"

export const enemies: EnemyDefinition[] = [
    {
        id: "skeleton",
        name: "Skeleton",
        imageUrl: skeletonEnemy,
        maxHp: 1,
        enemyType: "normal"
    },
    {
        id: "demon",
        name: "Demon",
        imageUrl: demonGirlEnemy,
        maxHp: 2,
        enemyType: "normal"
    },
    {
        id: "phoenix",
        name: "Phoenix",
        imageUrl: pheonixEnemy,
        maxHp: 7,
        enemyType: "boss"
    }
]

export function getEnemyDefinition(enemyId: string) {
    const enemy = enemies.find(candidate => candidate.id === enemyId)
    if (!enemy) throw new Error(`Unknown enemy id: ${enemyId}`)
    return enemy
}
