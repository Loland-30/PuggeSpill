import deadForestBackground from "../../assets/stages/dead_forest.png"
import terraceBackground from "../../assets/stages/terrace.png"
import type { ZoneDefinition } from "./zoneTypes"

export const zones: ZoneDefinition[] = [
    {
        id: "terrace",
        name: "Terrace",
        backgroundUrl: terraceBackground,
        encountersBeforeBoss: 10,
        enemyPool: ["reaper", "vampire-hunter"],
        bossEnemyId: "skeleton-death-knight"
    },
    {
        id: "dead-forest",
        name: "Dead Forest",
        backgroundUrl: deadForestBackground,
        encountersBeforeBoss: 10,
        enemyPool: ["reaper", "vampire-hunter"],
        bossEnemyId: "skeleton-death-knight"
    }
]
