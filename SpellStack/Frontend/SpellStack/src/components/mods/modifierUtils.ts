import type { ActiveGameModifier } from "../../api/gameSession"
import { MODIFIER_DEFINITIONS } from "./modifierData"

const incompatibleModifiers: Partial<Record<ActiveGameModifier, ActiveGameModifier[]>> = {
    zen: ["momentum", "noTime"],
    momentum: ["zen"],
    noTime: ["zen"]
}

export function getModifierDefinition(modifier: ActiveGameModifier) {
    return MODIFIER_DEFINITIONS.find(definition => definition.id === modifier)
}

export function getModifierNames(modifiers: ActiveGameModifier[]) {
    if (modifiers.length === 0) return "None"

    return modifiers
        .map(modifier => getModifierDefinition(modifier)?.name ?? String(modifier))
        .join(", ")
}

export function getModifierScoreMultiplier(modifiers: ActiveGameModifier[]) {
    if (modifiers.length === 0) return 1

    return modifiers.reduce((total, modifier) => {
        const definition = getModifierDefinition(modifier)
        if (!definition) return total

        return total * definition.scoreMultiplier
    }, 1)
}

export function formatScoreMultiplier(multiplier: number) {
    if (multiplier === 0) return "No score"
    return `x${multiplier.toFixed(2)}`
}

export function getModifierScoreLabel(modifier: ActiveGameModifier) {
    const definition = getModifierDefinition(modifier)
    if (!definition) return "Score x1.00"
    if (modifier === "momentum") return `Score ${formatScoreMultiplier(definition.scoreMultiplier)} + stacks`
    return `Score ${formatScoreMultiplier(definition.scoreMultiplier)}`
}

export function toggleModifier(
    modifiers: ActiveGameModifier[],
    modifier: ActiveGameModifier
) {
    if (modifiers.includes(modifier)) {
        return modifiers.filter(activeModifier => activeModifier !== modifier)
    }

    const incompatible = incompatibleModifiers[modifier] ?? []
    const compatibleModifiers = modifiers.filter(activeModifier => !incompatible.includes(activeModifier))

    return [...compatibleModifiers, modifier]
}
