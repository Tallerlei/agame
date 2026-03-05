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
 * Weapon item with attack properties
 */
export interface Weapon extends Item {
  type: ItemType.WEAPON;
  damage: number;
  attackSpeed: number;
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
  defense: number;
  slot: 'head' | 'chest' | 'legs' | 'feet';
}

/**
 * Bag item that expands inventory capacity
 */
export interface Bag extends Item {
  type: ItemType.BAG;
  slotsGranted: number;
}
