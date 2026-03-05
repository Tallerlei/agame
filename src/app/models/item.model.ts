/**
 * Item types available in the game
 */
export enum ItemType {
  WEAPON = 'WEAPON',
  CONSUMABLE = 'CONSUMABLE',
  TRINKET = 'TRINKET',
  ARMOR = 'ARMOR',
  BAG = 'BAG'
}

/**
 * Weapon type categories (used for class-restriction checks)
 */
export enum WeaponType {
  SWORD = 'SWORD',
  AXE = 'AXE',
  DAGGER = 'DAGGER',
  MACE = 'MACE',
  STAFF = 'STAFF',
  BOW = 'BOW'
}

/**
 * Armor weight class (used for class-restriction checks)
 */
export enum ArmorClass {
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  HEAVY = 'HEAVY'
}

/**
 * Item rarity levels
 */
export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

/**
 * Base item interface
 */
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  value: number;
}

/**
 * Stat bonuses granted by equipped weapons or armor
 */
export interface ItemStatBonus {
  strength?: number;
  agility?: number;
  intelligence?: number;
}

/**
 * Weapon item with attack properties
 */
export interface Weapon extends Item {
  type: ItemType.WEAPON;
  weaponType: WeaponType;
  damage: number;
  attackSpeed: number;
  /** Classes allowed to equip this weapon. Empty / absent = universal. */
  classRestriction?: string[];
  /** Additional stat bonuses from this weapon */
  statBonus?: ItemStatBonus;
}

/**
 * Consumable item with healing or buff effects
 */
export interface Consumable extends Item {
  type: ItemType.CONSUMABLE;
  healAmount?: number;
  buffDuration?: number;
  buffType?: string;
}

/**
 * Trinket item with passive bonuses
 */
export interface Trinket extends Item {
  type: ItemType.TRINKET;
  statBonus: {
    strength?: number;
    agility?: number;
    intelligence?: number;
    health?: number;
  };
}

/**
 * Armor item with defense properties
 */
export interface Armor extends Item {
  type: ItemType.ARMOR;
  armorClass: ArmorClass;
  defense: number;
  slot: 'head' | 'chest' | 'legs' | 'feet';
  /** Classes allowed to equip this armor. Empty / absent = universal. */
  classRestriction?: string[];
}

/**
 * Bag item that expands inventory capacity
 */
export interface Bag extends Item {
  type: ItemType.BAG;
  slotsGranted: number;
}
