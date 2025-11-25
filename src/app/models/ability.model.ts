/**
 * Ability types
 */
export enum AbilityType {
  ATTACK = 'ATTACK',
  HEAL = 'HEAL',
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF',
  PASSIVE = 'PASSIVE'
}

/**
 * Special ability that a character can use
 */
export interface Ability {
  id: string;
  name: string;
  description: string;
  type: AbilityType;
  damage?: number;
  healAmount?: number;
  cooldown: number;
  currentCooldown: number;
  manaCost: number;
  levelRequired: number;
}

/**
 * Creates a basic attack ability
 */
export function createBasicAttack(damage: number): Ability {
  return {
    id: 'basic-attack',
    name: 'Basic Attack',
    description: 'A simple attack dealing physical damage',
    type: AbilityType.ATTACK,
    damage,
    cooldown: 0,
    currentCooldown: 0,
    manaCost: 0,
    levelRequired: 1
  };
}
