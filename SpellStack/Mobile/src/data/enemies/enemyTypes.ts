import type { ImageSourcePropType } from "react-native"

export type EnemyType = "normal" | "miniBoss" | "boss"

export interface EnemyDefinition {
    id: string
    name: string
    imageUrl: ImageSourcePropType
    deathImageUrl?: ImageSourcePropType
    maxHp: number
    enemyType?: EnemyType
}

export interface ActiveEnemy extends EnemyDefinition {
    hp: number
    enemyType: EnemyType
}
