import { Character } from './character.model';

/**
 * Enemy type
 */
export interface Enemy {
  id: string;
  name: string;
  emoji: string;
  level: number;
  maxHealth: number;
  currentHealth: number;
  attackPower: number;
  defense: number;
  experienceReward: number;
  goldReward: number;
}

/** Maps enemy names to display emojis */
export function getEnemyEmoji(name: string): string {
  const emojiMap: Record<string, string> = {
    'Goblin': '👺',
    'Orc': '👹',
    'Skeleton': '💀',
    'Wolf': '🐺',
    'Bandit': '🗡️',
    'Troll': '👾',
    'Dragon': '🐉',
    'Guardian': '🛡️',
    'Cave Troll': '🧌',
  };
  return emojiMap[name] ?? '👿';
}

/** Result of a damage calculation, including critical hit flag */
export interface DamageResult {
  damage: number;
  isCritical: boolean;
}

/** Calculate damage with optional critical hit chance (default 15%) */
export function calculateDamageResult(
  attackPower: number,
  defense: number,
  critChance = 0.15
): DamageResult {
  const isCritical = Math.random() < critChance;
  const critMultiplier = isCritical ? 1.5 : 1;
  const baseDamage = attackPower - defense / 2;
  const variance = Math.random() * 0.2 - 0.1;
  return {
    damage: Math.max(1, Math.floor(baseDamage * (1 + variance) * critMultiplier)),
    isCritical
  };
}

/**
 * Combat action types
 */
export enum CombatActionType {
  ATTACK = 'ATTACK',
  ABILITY = 'ABILITY',
  USE_ITEM = 'USE_ITEM',
  FLEE = 'FLEE'
}

/**
 * Combat log entry
 */
export interface CombatLogEntry {
  timestamp: number;
  attacker: string;
  defender: string;
  action: CombatActionType;
  damage?: number;
  healing?: number;
  message: string;
}

/**
 * Combat state
 */
export interface CombatState {
  isActive: boolean;
  currentTurn: 'player' | 'enemy';
  player: Character | null;
  enemy: Enemy | null;
  combatLog: CombatLogEntry[];
  turnCount: number;
}

/**
 * Combat result
 */
export interface CombatResult {
  victory: boolean;
  experienceGained: number;
  goldGained: number;
  itemsGained: string[];
}

/**
 * Create an enemy based on level
 */
export function createEnemy(name: string, level: number): Enemy {
  const healthMultiplier = 1 + (level - 1) * 0.2;
  const attackMultiplier = 1 + (level - 1) * 0.15;

  return {
    id: crypto.randomUUID(),
    name,
    emoji: getEnemyEmoji(name),
    level,
    maxHealth: Math.floor(50 * healthMultiplier),
    currentHealth: Math.floor(50 * healthMultiplier),
    attackPower: Math.floor(8 * attackMultiplier),
    defense: Math.floor(3 + level),
    experienceReward: Math.floor(25 * level),
    goldReward: Math.floor(10 * level)
  };
}

/**
 * Calculate damage dealt
 */
export function calculateDamage(
  attackPower: number,
  defense: number
): number {
  const baseDamage = attackPower - defense / 2;
  const variance = Math.random() * 0.2 - 0.1; // -10% to +10%
  return Math.max(1, Math.floor(baseDamage * (1 + variance)));
}
