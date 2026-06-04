import type { ImageSourcePropType } from "react-native"

export interface ZoneDefinition {
    id: string
    name: string
    backgroundUrl: ImageSourcePropType
    encountersBeforeBoss: number
    enemyPool: string[]
    bossEnemyId: string
}
