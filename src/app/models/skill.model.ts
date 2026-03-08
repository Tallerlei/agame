import { AbilityType } from './ability.model';
import { CharacterClass } from './character.model';

/**
 * A skill that can be unlocked at level milestones (every 5 levels).
 * Active skills appear as combat actions; passive skills grant permanent stat bonuses.
 */
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  abilityType: AbilityType;
  characterClass: CharacterClass;
  /** Damage dealt (active attack skills) */
  damage?: number;
  /** HP restored (active heal skills) */
  healAmount?: number;
  /** Cooldown in combat turns (0 for passive) */
  cooldownTurns: number;
  manaCost: number;
  /** The level milestone at which this skill first becomes selectable */
  levelRequired: number;
  isPassive: boolean;
  /** Permanent stat bonuses applied when a passive skill is learned */
  passiveBonus?: {
    strength?: number;
    agility?: number;
    intelligence?: number;
    defense?: number;
    attackPower?: number;
    maxHealth?: number;
  };
  isAoe?: boolean;
}

/** Return all skill choices for a class at a given milestone level (2 active + 1 passive). */
export function getSkillChoicesForLevel(
  characterClass: CharacterClass,
  level: number,
  unlockedSkillIds: string[]
): SkillDefinition[] {
  const pool = SKILL_POOL[characterClass] ?? [];
  // Prefer skills whose levelRequired matches the milestone exactly
  const tier = pool.filter(s => s.levelRequired === level && !unlockedSkillIds.includes(s.id));
  if (tier.length === 3) return tier;

  // Fallback: any unlockable skill not yet owned
  const fallback = pool.filter(s => s.levelRequired <= level && !unlockedSkillIds.includes(s.id));
  if (fallback.length === 0) return [];

  // Return up to 3: prefer 2 active + 1 passive
  const active = fallback.filter(s => !s.isPassive);
  const passive = fallback.filter(s => s.isPassive);
  const choices: SkillDefinition[] = [...active.slice(0, 2), ...passive.slice(0, 1)];
  // Pad with remaining if fewer than expected
  if (choices.length < 3) {
    const remaining = fallback.filter(s => !choices.includes(s));
    choices.push(...remaining.slice(0, 3 - choices.length));
  }
  return choices.slice(0, 3);
}

/**
 * Class-specific skill pools.
 * Each pool contains 3 skills per milestone tier (2 active, 1 passive).
 */
export const SKILL_POOL: Record<CharacterClass, SkillDefinition[]> = {
  [CharacterClass.WARRIOR]: [
    // Level 5
    {
      id: 'cleave', name: 'Cleave',
      description: 'A wide AoE strike dealing 120% damage to nearby enemies',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.WARRIOR,
      damage: 25, cooldownTurns: 6, manaCost: 20, levelRequired: 5, isPassive: false, isAoe: true
    },
    {
      id: 'power-slam', name: 'Power Slam',
      description: 'A devastating slam dealing 150% weapon damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.WARRIOR,
      damage: 30, cooldownTurns: 5, manaCost: 15, levelRequired: 5, isPassive: false
    },
    {
      id: 'iron-skin', name: 'Iron Skin',
      description: 'Passive: Harden your skin. +5 defense permanently',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.WARRIOR,
      cooldownTurns: 0, manaCost: 0, levelRequired: 5, isPassive: true,
      passiveBonus: { defense: 5 }
    },
    // Level 10
    {
      id: 'war-cry', name: 'War Cry',
      description: 'Unleash a battle cry that deals 35 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.WARRIOR,
      damage: 35, cooldownTurns: 8, manaCost: 25, levelRequired: 10, isPassive: false
    },
    {
      id: 'reckless-strike', name: 'Reckless Strike',
      description: 'Reckless 200% power attack for 45 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.WARRIOR,
      damage: 45, cooldownTurns: 7, manaCost: 30, levelRequired: 10, isPassive: false
    },
    {
      id: 'battle-hardened', name: 'Battle Hardened',
      description: 'Passive: Years of battle harden your body. +20 max HP',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.WARRIOR,
      cooldownTurns: 0, manaCost: 0, levelRequired: 10, isPassive: true,
      passiveBonus: { maxHealth: 20 }
    },
    // Level 15
    {
      id: 'whirlwind', name: 'Whirlwind',
      description: 'Spin and deal 55 damage to all enemies',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.WARRIOR,
      damage: 55, cooldownTurns: 10, manaCost: 40, levelRequired: 15, isPassive: false, isAoe: true
    },
    {
      id: 'berserker-rage', name: 'Berserker Rage',
      description: 'Channel raw fury for 60 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.WARRIOR,
      damage: 60, cooldownTurns: 12, manaCost: 35, levelRequired: 15, isPassive: false
    },
    {
      id: 'warriors-resolve', name: "Warrior's Resolve",
      description: 'Passive: Unbreakable resolve. +5 STR, +3 DEF',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.WARRIOR,
      cooldownTurns: 0, manaCost: 0, levelRequired: 15, isPassive: true,
      passiveBonus: { strength: 5, defense: 3 }
    }
  ],

  [CharacterClass.MAGE]: [
    // Level 5
    {
      id: 'ice-lance', name: 'Ice Lance',
      description: 'Launch a piercing lance of ice dealing 30 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.MAGE,
      damage: 30, cooldownTurns: 5, manaCost: 25, levelRequired: 5, isPassive: false
    },
    {
      id: 'thunder-bolt', name: 'Thunder Bolt',
      description: 'Call down lightning dealing 28 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.MAGE,
      damage: 28, cooldownTurns: 4, manaCost: 20, levelRequired: 5, isPassive: false
    },
    {
      id: 'arcane-mastery', name: 'Arcane Mastery',
      description: 'Passive: Master the arcane. +3 INT, +8 attack power',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.MAGE,
      cooldownTurns: 0, manaCost: 0, levelRequired: 5, isPassive: true,
      passiveBonus: { intelligence: 3, attackPower: 8 }
    },
    // Level 10
    {
      id: 'blizzard', name: 'Blizzard',
      description: 'Summon a blizzard dealing 35 AoE damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.MAGE,
      damage: 35, cooldownTurns: 8, manaCost: 40, levelRequired: 10, isPassive: false, isAoe: true
    },
    {
      id: 'chain-lightning', name: 'Chain Lightning',
      description: 'Lightning chains between enemies dealing 40 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.MAGE,
      damage: 40, cooldownTurns: 7, manaCost: 35, levelRequired: 10, isPassive: false
    },
    {
      id: 'mana-shield', name: 'Mana Shield',
      description: 'Passive: Shield yourself with mana. +25 max mana, +3 defense',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.MAGE,
      cooldownTurns: 0, manaCost: 0, levelRequired: 10, isPassive: true,
      passiveBonus: { defense: 3 }
    },
    // Level 15
    {
      id: 'meteor', name: 'Meteor',
      description: 'Call down a devastating meteor for 65 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.MAGE,
      damage: 65, cooldownTurns: 12, manaCost: 55, levelRequired: 15, isPassive: false
    },
    {
      id: 'arcane-burst', name: 'Arcane Burst',
      description: 'Release pure arcane energy for 50 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.MAGE,
      damage: 50, cooldownTurns: 9, manaCost: 45, levelRequired: 15, isPassive: false
    },
    {
      id: 'spell-power', name: 'Spell Power',
      description: 'Passive: Raw magical power. +5 INT, +8 attack power',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.MAGE,
      cooldownTurns: 0, manaCost: 0, levelRequired: 15, isPassive: true,
      passiveBonus: { intelligence: 5, attackPower: 8 }
    }
  ],

  [CharacterClass.ROGUE]: [
    // Level 5
    {
      id: 'poison-strike', name: 'Poison Strike',
      description: 'Coat your blade in poison for 22 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.ROGUE,
      damage: 22, cooldownTurns: 5, manaCost: 15, levelRequired: 5, isPassive: false
    },
    {
      id: 'shadow-step', name: 'Shadow Step',
      description: 'Step through shadows for a guaranteed 28 damage strike',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.ROGUE,
      damage: 28, cooldownTurns: 6, manaCost: 20, levelRequired: 5, isPassive: false
    },
    {
      id: 'evasion', name: 'Evasion',
      description: 'Passive: Nimble footwork. +3 agility, +2 defense',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.ROGUE,
      cooldownTurns: 0, manaCost: 0, levelRequired: 5, isPassive: true,
      passiveBonus: { agility: 3, defense: 2 }
    },
    // Level 10
    {
      id: 'smoke-bomb', name: 'Smoke Bomb',
      description: 'Blind the enemy, dealing 30 damage with guaranteed hit',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.ROGUE,
      damage: 30, cooldownTurns: 8, manaCost: 25, levelRequired: 10, isPassive: false
    },
    {
      id: 'assassination', name: 'Assassination',
      description: 'Strike a vital point for 50 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.ROGUE,
      damage: 50, cooldownTurns: 9, manaCost: 35, levelRequired: 10, isPassive: false
    },
    {
      id: 'shadow-cloak', name: 'Shadow Cloak',
      description: 'Passive: Move through shadows. +5 agility',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.ROGUE,
      cooldownTurns: 0, manaCost: 0, levelRequired: 10, isPassive: true,
      passiveBonus: { agility: 5 }
    },
    // Level 15
    {
      id: 'death-mark', name: 'Death Mark',
      description: 'Mark the enemy for death, dealing 70 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.ROGUE,
      damage: 70, cooldownTurns: 12, manaCost: 45, levelRequired: 15, isPassive: false
    },
    {
      id: 'combo-strike', name: 'Combo Strike',
      description: 'Three rapid strikes dealing 35 total damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.ROGUE,
      damage: 35, cooldownTurns: 7, manaCost: 30, levelRequired: 15, isPassive: false
    },
    {
      id: 'lethal-tempo', name: 'Lethal Tempo',
      description: 'Passive: Speed defines you. +5 agility, +3 attack power',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.ROGUE,
      cooldownTurns: 0, manaCost: 0, levelRequired: 15, isPassive: true,
      passiveBonus: { agility: 5, attackPower: 3 }
    }
  ],

  [CharacterClass.HEALER]: [
    // Level 5
    {
      id: 'holy-light', name: 'Holy Light',
      description: 'Bathe yourself in holy light, healing 40 HP',
      abilityType: AbilityType.HEAL, characterClass: CharacterClass.HEALER,
      healAmount: 40, cooldownTurns: 5, manaCost: 30, levelRequired: 5, isPassive: false
    },
    {
      id: 'smite', name: 'Smite',
      description: 'Channel holy power dealing 25 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.HEALER,
      damage: 25, cooldownTurns: 4, manaCost: 20, levelRequired: 5, isPassive: false
    },
    {
      id: 'divine-blessing', name: 'Divine Blessing',
      description: 'Passive: Blessed constitution. +3 INT, +10 max HP',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.HEALER,
      cooldownTurns: 0, manaCost: 0, levelRequired: 5, isPassive: true,
      passiveBonus: { intelligence: 3, maxHealth: 10 }
    },
    // Level 10
    {
      id: 'greater-heal', name: 'Greater Heal',
      description: 'Powerful heal restoring 60 HP',
      abilityType: AbilityType.HEAL, characterClass: CharacterClass.HEALER,
      healAmount: 60, cooldownTurns: 8, manaCost: 45, levelRequired: 10, isPassive: false
    },
    {
      id: 'holy-nova', name: 'Holy Nova',
      description: 'Explode with holy energy dealing 35 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.HEALER,
      damage: 35, cooldownTurns: 7, manaCost: 35, levelRequired: 10, isPassive: false
    },
    {
      id: 'prayer-of-healing', name: 'Prayer of Healing',
      description: 'Passive: Continuous prayer. +20 max HP, +3 defense',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.HEALER,
      cooldownTurns: 0, manaCost: 0, levelRequired: 10, isPassive: true,
      passiveBonus: { maxHealth: 20, defense: 3 }
    },
    // Level 15
    {
      id: 'divine-intervention', name: 'Divine Intervention',
      description: 'Call upon divine power to heal 100 HP',
      abilityType: AbilityType.HEAL, characterClass: CharacterClass.HEALER,
      healAmount: 100, cooldownTurns: 12, manaCost: 60, levelRequired: 15, isPassive: false
    },
    {
      id: 'judgment', name: 'Judgment',
      description: 'Divine judgment strikes for 55 damage',
      abilityType: AbilityType.ATTACK, characterClass: CharacterClass.HEALER,
      damage: 55, cooldownTurns: 10, manaCost: 45, levelRequired: 15, isPassive: false
    },
    {
      id: 'sacred-ground', name: 'Sacred Ground',
      description: 'Passive: Walk on sacred ground. +5 INT, +5 DEF',
      abilityType: AbilityType.PASSIVE, characterClass: CharacterClass.HEALER,
      cooldownTurns: 0, manaCost: 0, levelRequired: 15, isPassive: true,
      passiveBonus: { intelligence: 5, defense: 5 }
    }
  ]
};
