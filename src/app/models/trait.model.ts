import { ItemRarity } from './item.model';

/** Stat keys that can be affected by trait effects */
export type TraitStatKey =
  | 'strength'
  | 'agility'
  | 'intelligence'
  | 'defense'
  | 'attackPower'
  | 'maxHealth';

/** A permanent positive stat bonus granted by a trait */
export interface TraitPositiveEffect {
  stat: TraitStatKey;
  amount: number;
}

/** A chance-based negative effect from a trait (temporary or tiny permanent) */
export interface TraitNegativeEffect {
  stat: TraitStatKey;
  amount: number;
  /** How many fights the debuff lasts (0 = tiny permanent penalty) */
  durationFights: number;
  /** Probability of the negative effect triggering on first consumption (0–1) */
  chance: number;
}

/** Static template describing a body-part drop */
export interface TraitDefinition {
  id: string;
  name: string;
  /** Enemy type that drops this body part */
  enemyName: string;
  rarity: ItemRarity;
  riskLevel: 'low' | 'medium' | 'high';
  positiveEffect: TraitPositiveEffect;
  negativeEffect: TraitNegativeEffect;
  /** Optional visual indicator key */
  spriteMod?: string;
}

/** Runtime trait state stored on a character */
export interface ActiveTrait {
  definitionId: string;
  name: string;
  rarity: ItemRarity;
  riskLevel: 'low' | 'medium' | 'high';
  positiveEffect: TraitPositiveEffect;
  negativeEffect: TraitNegativeEffect;
  /** Whether the negative debuff is currently in effect */
  negativeDebuffActive: boolean;
  /** Remaining fights with the active debuff (counts down each fight) */
  negativeDebuffRemainingFights: number;
  /** Total times this trait type has been consumed */
  consumeCount: number;
  spriteMod?: string;
}

/** Drop-chance percentage for each rarity (0–1) */
export const TRAIT_DROP_CHANCE: Record<ItemRarity, number> = {
  [ItemRarity.COMMON]:    0.12,
  [ItemRarity.UNCOMMON]:  0.09,
  [ItemRarity.RARE]:      0.07,
  [ItemRarity.EPIC]:      0.05,
  [ItemRarity.LEGENDARY]: 0.04
};

/** Library of all body-part trait definitions */
export const TRAIT_DEFINITIONS: TraitDefinition[] = [
  {
    id: 'goblin-ear',
    name: 'Goblin Ohr',
    enemyName: 'Goblin',
    rarity: ItemRarity.COMMON,
    riskLevel: 'low',
    positiveEffect:  { stat: 'agility', amount: 1 },
    negativeEffect:  { stat: 'defense', amount: 1, durationFights: 2, chance: 0.10 }
  },
  {
    id: 'orc-heart',
    name: 'Orc Herz',
    enemyName: 'Orc',
    rarity: ItemRarity.RARE,
    riskLevel: 'medium',
    positiveEffect:  { stat: 'strength', amount: 4 },
    negativeEffect:  { stat: 'agility', amount: 2, durationFights: 2, chance: 0.35 },
    spriteMod: 'red-eyes'
  },
  {
    id: 'skeleton-bone',
    name: 'Skelett Knochen',
    enemyName: 'Skeleton',
    rarity: ItemRarity.UNCOMMON,
    riskLevel: 'low',
    positiveEffect:  { stat: 'defense', amount: 2 },
    negativeEffect:  { stat: 'maxHealth', amount: 5, durationFights: 3, chance: 0.20 }
  },
  {
    id: 'wolf-claw',
    name: 'Wolf Klaue',
    enemyName: 'Wolf',
    rarity: ItemRarity.COMMON,
    riskLevel: 'low',
    positiveEffect:  { stat: 'attackPower', amount: 2 },
    negativeEffect:  { stat: 'strength', amount: 1, durationFights: 2, chance: 0.10 }
  },
  {
    id: 'bandit-eye',
    name: 'Banditen Auge',
    enemyName: 'Bandit',
    rarity: ItemRarity.UNCOMMON,
    riskLevel: 'medium',
    positiveEffect:  { stat: 'agility', amount: 3 },
    negativeEffect:  { stat: 'attackPower', amount: 2, durationFights: 3, chance: 0.25 }
  },
  {
    id: 'troll-hide',
    name: 'Troll Haut',
    enemyName: 'Troll',
    rarity: ItemRarity.RARE,
    riskLevel: 'high',
    positiveEffect:  { stat: 'defense', amount: 5 },
    negativeEffect:  { stat: 'strength', amount: 3, durationFights: 3, chance: 0.40 },
    spriteMod: 'green-tint'
  }
];

/** Look up a TraitDefinition by enemy name (case-insensitive). */
export function getTraitDefinitionByEnemy(enemyName: string): TraitDefinition | undefined {
  const lower = enemyName.toLowerCase();
  return TRAIT_DEFINITIONS.find(t => t.enemyName.toLowerCase() === lower);
}
