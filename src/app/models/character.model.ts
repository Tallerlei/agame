import { Ability } from './ability.model';
import { Item, Weapon, Armor, Trinket, Consumable, Bag, ItemType, WeaponType, ArmorClass } from './item.model';

/**
 * Character class types with unique abilities
 */
export enum CharacterClass {
  WARRIOR = 'WARRIOR',
  MAGE = 'MAGE',
  ROGUE = 'ROGUE',
  HEALER = 'HEALER'
}

/**
 * Character stats
 */
export interface CharacterStats {
  strength: number;
  agility: number;
  intelligence: number;
  maxHealth: number;
  currentHealth: number;
  maxMana: number;
  currentMana: number;
  defense: number;
  attackPower: number;
}

/**
 * Character equipment slots
 */
export interface Equipment {
  weapon?: Weapon;
  head?: Armor;
  chest?: Armor;
  legs?: Armor;
  feet?: Armor;
  trinket?: Trinket;
  bag?: Bag;
}

/**
 * Character inventory
 */
export interface Inventory {
  items: Item[];
  maxSize: number;
}

/**
 * Game character with stats, abilities, and items
 */
export interface Character {
  id: string;
  name: string;
  characterClass: CharacterClass;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  stats: CharacterStats;
  abilities: Ability[];
  equipment: Equipment;
  inventory: Inventory;
  gold: number;
  questsCompleted: number;
  fightsWon: number;
}

/**
 * Create default stats based on character class
 */
export function createDefaultStats(characterClass: CharacterClass): CharacterStats {
  const baseStats: CharacterStats = {
    strength: 10,
    agility: 10,
    intelligence: 10,
    maxHealth: 100,
    currentHealth: 100,
    maxMana: 50,
    currentMana: 50,
    defense: 5,
    attackPower: 10
  };

  switch (characterClass) {
    case CharacterClass.WARRIOR:
      return {
        ...baseStats,
        strength: 15,
        maxHealth: 150,
        currentHealth: 150,
        defense: 10,
        attackPower: 15
      };
    case CharacterClass.MAGE:
      return {
        ...baseStats,
        intelligence: 18,
        maxMana: 100,
        currentMana: 100,
        attackPower: 8
      };
    case CharacterClass.ROGUE:
      return {
        ...baseStats,
        agility: 18,
        attackPower: 12
      };
    case CharacterClass.HEALER:
      return {
        ...baseStats,
        intelligence: 15,
        maxMana: 80,
        currentMana: 80,
        maxHealth: 120,
        currentHealth: 120
      };
    default:
      return baseStats;
  }
}

/**
 * Calculate experience needed for next level
 */
export function calculateExpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Calculate how many items a character can carry before penalties.
 * Equals the character's strength stat.
 */
export function calculateCarryCapacity(strength: number): number {
  return strength;
}

/**
 * Calculate encumbrance ratio (0–1) based on items carried vs carry capacity.
 * > 0.5 = minor attack penalty; > 0.75 = movement penalty + larger attack penalty.
 */
export function calculateEncumbrance(itemCount: number, strength: number): number {
  const capacity = calculateCarryCapacity(strength);
  return capacity > 0 ? Math.min(1, itemCount / capacity) : 1;
}

/**
 * Create a new character
 */
export function createCharacter(
  name: string,
  characterClass: CharacterClass
): Character {
  return {
    id: crypto.randomUUID(),
    name,
    characterClass,
    level: 1,
    experience: 0,
    experienceToNextLevel: calculateExpToNextLevel(1),
    stats: createDefaultStats(characterClass),
    abilities: [],
    equipment: {},
    inventory: { items: [], maxSize: 10 },
    gold: 0,
    questsCompleted: 0,
    fightsWon: 0
  };
}

/**
 * Weapon types each class is allowed to wield (O(1) lookup via Set).
 */
const CLASS_ALLOWED_WEAPON_TYPES: Record<CharacterClass, Set<WeaponType>> = {
  [CharacterClass.WARRIOR]: new Set([WeaponType.SWORD, WeaponType.AXE, WeaponType.MACE]),
  [CharacterClass.MAGE]:    new Set([WeaponType.STAFF]),
  [CharacterClass.ROGUE]:   new Set([WeaponType.DAGGER, WeaponType.BOW]),
  [CharacterClass.HEALER]:  new Set([WeaponType.STAFF, WeaponType.MACE])
};

/**
 * Armor weight classes each class is allowed to wear (O(1) lookup via Set).
 */
const CLASS_ALLOWED_ARMOR_CLASSES: Record<CharacterClass, Set<ArmorClass>> = {
  [CharacterClass.WARRIOR]: new Set([ArmorClass.HEAVY, ArmorClass.MEDIUM, ArmorClass.LIGHT]),
  [CharacterClass.MAGE]:    new Set([ArmorClass.LIGHT]),
  [CharacterClass.ROGUE]:   new Set([ArmorClass.LIGHT, ArmorClass.MEDIUM]),
  [CharacterClass.HEALER]:  new Set([ArmorClass.LIGHT, ArmorClass.MEDIUM])
};

/**
 * Check whether a character is allowed to equip an item.
 * Returns { canEquip: true } on success or { canEquip: false, reason } on failure.
 *
 * Logic (in priority order):
 *  1. Consumables / Trinkets / Bags are always equippable.
 *  2. If the item has an explicit `classRestriction` array, that is checked first.
 *  3. Otherwise the character's class is validated against the allowed weapon-type /
 *     armor-class sets above.
 */
export function canEquipItem(
  character: Character,
  item: Item
): { canEquip: boolean; reason?: string } {
  if (item.type === ItemType.WEAPON) {
    const weapon = item as Weapon;
    if (weapon.classRestriction && weapon.classRestriction.length > 0) {
      if (!weapon.classRestriction.includes(character.characterClass)) {
        const allowed = weapon.classRestriction
          .map(c => c.charAt(0) + c.slice(1).toLowerCase())
          .join(', ');
        return { canEquip: false, reason: `Nur für ${allowed} geeignet!` };
      }
    } else {
      const allowedTypes = CLASS_ALLOWED_WEAPON_TYPES[character.characterClass];
      if (!allowedTypes.has(weapon.weaponType)) {
        const className = character.characterClass.charAt(0) + character.characterClass.slice(1).toLowerCase();
        return { canEquip: false, reason: `${className} kann keine ${weapon.weaponType}-Waffen tragen.` };
      }
    }
  } else if (item.type === ItemType.ARMOR) {
    const armor = item as Armor;
    if (armor.classRestriction && armor.classRestriction.length > 0) {
      if (!armor.classRestriction.includes(character.characterClass)) {
        const allowed = armor.classRestriction
          .map(c => c.charAt(0) + c.slice(1).toLowerCase())
          .join(', ');
        return { canEquip: false, reason: `Nur für ${allowed} geeignet!` };
      }
    } else {
      const allowedArmor = CLASS_ALLOWED_ARMOR_CLASSES[character.characterClass];
      if (!allowedArmor.has(armor.armorClass)) {
        const className = character.characterClass.charAt(0) + character.characterClass.slice(1).toLowerCase();
        return { canEquip: false, reason: `${className} kann keine ${armor.armorClass}-Rüstung tragen.` };
      }
    }
  }
  return { canEquip: true };
}
