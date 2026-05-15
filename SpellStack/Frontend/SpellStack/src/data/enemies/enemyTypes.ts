export type EnemyType = "normal" | "miniBoss" | "boss"

export interface EnemyDefinition {
    id: string
    name: string
    imageUrl: string
    deathImageUrl?: string
    maxHp: number
    enemyType?: EnemyType
}

export interface ActiveEnemy extends EnemyDefinition {
    hp: number
    enemyType: EnemyType
}
