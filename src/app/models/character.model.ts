import { Ability } from './ability.model';
import { Item, Weapon, Armor, Trinket, Consumable, ItemType, WeaponType, ArmorClass } from './item.model';

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
    inventory: { items: [], maxSize: 20 },
    gold: 0,
    questsCompleted: 0,
    fightsWon: 0
  };
}

/**
 * Get allowed weapon types for a character class
 */
export function getAllowedWeaponTypes(characterClass: CharacterClass): WeaponType[] {
  switch (characterClass) {
    case CharacterClass.WARRIOR: return [WeaponType.SWORD, WeaponType.AXE, WeaponType.MACE];
    case CharacterClass.MAGE: return [WeaponType.STAFF];
    case CharacterClass.ROGUE: return [WeaponType.DAGGER, WeaponType.BOW];
    case CharacterClass.HEALER: return [WeaponType.STAFF, WeaponType.MACE];
    default: return Object.values(WeaponType);
  }
}

/**
 * Get allowed armor classes for a character class
 */
export function getAllowedArmorClasses(characterClass: CharacterClass): ArmorClass[] {
  switch (characterClass) {
    case CharacterClass.WARRIOR: return [ArmorClass.HEAVY, ArmorClass.MEDIUM, ArmorClass.LIGHT];
    case CharacterClass.MAGE: return [ArmorClass.LIGHT];
    case CharacterClass.ROGUE: return [ArmorClass.LIGHT, ArmorClass.MEDIUM];
    case CharacterClass.HEALER: return [ArmorClass.LIGHT, ArmorClass.MEDIUM];
    default: return Object.values(ArmorClass);
  }
}

/**
 * Check if a character can equip a given item based on class restrictions
 */
export function canEquipItem(character: Character, item: Item): boolean {
  if (item.type === ItemType.WEAPON) {
    const weapon = item as Weapon;
    return getAllowedWeaponTypes(character.characterClass).includes(weapon.weaponType);
  }
  if (item.type === ItemType.ARMOR) {
    const armor = item as Armor;
    return getAllowedArmorClasses(character.characterClass).includes(armor.armorClass);
  }
  if (item.type === ItemType.TRINKET) {
    return true;
  }
  // Consumables and other item types cannot be equipped
  return false;
}
