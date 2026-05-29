import crystalCavesBackground from "../../assets/stages/Crystal_caves_bg.jpeg"
import enchantingForestBackground from "../../assets/stages/Enchanting_Forest_bg.jpg"
import type { ZoneDefinition } from "./zoneTypes"

export const zones: ZoneDefinition[] = [
    {
        id: "crystal-cave",
        name: "Crystal Cave",
        backgroundUrl: crystalCavesBackground,
        encountersBeforeBoss: 10,
        enemyPool: ["skeleton", "demon"],
        bossEnemyId: "phoenix"
    },
    {
        id: "enchanted-forest",
        name: "Enchanted Forest",
        backgroundUrl: enchantingForestBackground,
        encountersBeforeBoss: 10,
        enemyPool: ["demon", "skeleton"],
        bossEnemyId: "phoenix"
    }
]
