import { useRef, useState } from "react"
import { getEnemyDefinition } from "../data/enemies/enemies"
import type { ActiveEnemy, EnemyDefinition } from "../data/enemies/enemyTypes"
import { zones } from "../data/zones/zones"
import type { ZoneDefinition } from "../data/zones/zoneTypes"

function chooseRandomItem<T>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)]
}

function chooseNextZone(currentZoneId: string) {
    const availableZones = zones.length > 1
        ? zones.filter(zone => zone.id !== currentZoneId)
        : zones

    return chooseRandomItem(availableZones)
}

function chooseStartingZone() {
    return chooseRandomItem(zones)
}

function createActiveEnemy(enemy: EnemyDefinition, enemyType = enemy.enemyType ?? "normal"): ActiveEnemy {
    return {
        ...enemy,
        enemyType,
        hp: enemy.maxHp
    }
}

function getEnemyForEncounter(zone: ZoneDefinition, encounterIndex: number) {
    const isBossEncounter = encounterIndex >= zone.encountersBeforeBoss
    const enemyId = isBossEncounter
        ? zone.bossEnemyId
        : chooseRandomItem(zone.enemyPool)

    return createActiveEnemy(
        getEnemyDefinition(enemyId),
        isBossEncounter ? "boss" : "normal"
    )
}

export function useZoneRun() {
    const startingZoneRef = useRef<ZoneDefinition | null>(null)
    if (startingZoneRef.current === null) {
        startingZoneRef.current = chooseStartingZone()
    }

    const [currentZone, setCurrentZone] = useState<ZoneDefinition>(() => startingZoneRef.current ?? zones[0])
    const [currentEncounterIndex, setCurrentEncounterIndex] = useState(1)
    const [currentEnemy, setCurrentEnemy] = useState<ActiveEnemy>(() => getEnemyForEncounter(startingZoneRef.current ?? zones[0], 1))
    const [streak, setStreak] = useState(0)
    const [enemiesKilled, setEnemiesKilled] = useState(0)
    const [zonesCleared, setZonesCleared] = useState(0)

    const isBossEncounter = currentEncounterIndex >= currentZone.encountersBeforeBoss

    const advanceEncounter = () => {
        if (isBossEncounter) {
            const nextZone = chooseNextZone(currentZone.id)

            setCurrentZone(nextZone)
            setCurrentEncounterIndex(1)
            setCurrentEnemy(getEnemyForEncounter(nextZone, 1))
            setZonesCleared(current => current + 1)
            return
        }

        const nextEncounterIndex = currentEncounterIndex + 1
        setCurrentEncounterIndex(nextEncounterIndex)
        setCurrentEnemy(getEnemyForEncounter(currentZone, nextEncounterIndex))
    }

    const onCorrectAnswer = () => {
        const nextStreak = streak + 1
        const nextHp = Math.max(0, currentEnemy.hp - 1)

        if (nextHp <= 0) {
            setEnemiesKilled(current => current + 1)
            setStreak(nextStreak)
            advanceEncounter()
            return
        }

        setStreak(nextStreak)
        setCurrentEnemy(enemy => ({ ...enemy, hp: nextHp }))
    }

    const onWrongAnswer = () => {
        setStreak(0)
    }

    const resetZoneRun = () => {
        const nextStartingZone = chooseStartingZone()
        startingZoneRef.current = nextStartingZone

        setCurrentZone(nextStartingZone)
        setCurrentEncounterIndex(1)
        setCurrentEnemy(getEnemyForEncounter(nextStartingZone, 1))
        setStreak(0)
        setEnemiesKilled(0)
        setZonesCleared(0)
    }

    return {
        currentZone,
        currentEncounterIndex,
        currentEnemy,
        isBossEncounter,
        streak,
        enemiesKilled,
        zonesCleared,
        advanceEncounter,
        chooseNextZone: () => chooseNextZone(currentZone.id),
        onCorrectAnswer,
        onWrongAnswer,
        resetZoneRun
    }
}
