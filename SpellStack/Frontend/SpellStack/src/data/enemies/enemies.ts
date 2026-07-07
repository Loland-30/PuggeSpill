import blackWizardDying from "../../assets/enemies/black-wizard/dying.png"
import blackWizardIdle from "../../assets/enemies/black-wizard/idle.png"
import reaperDying from "../../assets/enemies/reaper/dying.png"
import reaperIdle from "../../assets/enemies/reaper/idle.png"
import skeletonDeathKnightDying from "../../assets/enemies/skeleton-death-knight/dying.png"
import skeletonDeathKnightIdle from "../../assets/enemies/skeleton-death-knight/idle.png"
import vampireHunterDying from "../../assets/enemies/vampire-hunter/dying.png"
import vampireHunterIdle from "../../assets/enemies/vampire-hunter/idle.png"
import type { EnemyDefinition } from "./enemyTypes"

export const enemies: EnemyDefinition[] = [
    {
        id: "black-wizard",
        name: "Black Wizard",
        imageUrl: blackWizardIdle,
        deathImageUrl: blackWizardDying,
        maxHp: 2,
        enemyType: "normal"
    },
    {
        id: "reaper",
        name: "Reaper",
        imageUrl: reaperIdle,
        deathImageUrl: reaperDying,
        maxHp: 3,
        enemyType: "normal"
    },
    {
        id: "vampire-hunter",
        name: "Vampire Hunter",
        imageUrl: vampireHunterIdle,
        deathImageUrl: vampireHunterDying,
        maxHp: 4,
        enemyType: "normal"
    },
    {
        id: "skeleton-death-knight",
        name: "Death Knight",
        imageUrl: skeletonDeathKnightIdle,
        deathImageUrl: skeletonDeathKnightDying,
        maxHp: 7,
        enemyType: "boss"
    }
]

export function getEnemyDefinition(enemyId: string) {
    const enemy = enemies.find(candidate => candidate.id === enemyId)
    if (!enemy) throw new Error(`Unknown enemy id: ${enemyId}`)
    return enemy
}
