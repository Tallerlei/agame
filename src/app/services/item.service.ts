import { Injectable } from '@angular/core';
import {
  Item,
  ItemType,
  ItemRarity,
  Weapon,
  Armor,
  Consumable,
  Trinket,
  Bag
} from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private weaponNames = ['Sword', 'Axe', 'Dagger', 'Mace', 'Staff', 'Bow'];
  private armorPrefixes = ['Iron', 'Steel', 'Bronze', 'Leather', 'Plate'];
  private consumableNames = ['Health Potion', 'Mana Potion', 'Elixir', 'Bandage'];
  private trinketNames = ['Ring', 'Amulet', 'Charm', 'Talisman'];
  private bagNames = ['Pouch', 'Satchel', 'Backpack', 'Pack'];

  /**
   * Generate a random item based on level
   */
  generateRandomItem(level: number): Item {
    // Bags are rarer drop candidates (10% chance)
    const roll = Math.random();
    if (roll < 0.1) {
      const rarity = this.getRandomRarity(level);
      return this.generateBag(level, rarity);
    }
    const types = [ItemType.WEAPON, ItemType.ARMOR, ItemType.CONSUMABLE, ItemType.TRINKET];
    const type = types[Math.floor(Math.random() * types.length)];
    const rarity = this.getRandomRarity(level);

    switch (type) {
      case ItemType.WEAPON:
        return this.generateWeapon(level, rarity);
      case ItemType.ARMOR:
        return this.generateArmor(level, rarity);
      case ItemType.CONSUMABLE:
        return this.generateConsumable(level, rarity);
      case ItemType.TRINKET:
        return this.generateTrinket(level, rarity);
      default:
        return this.generateWeapon(level, rarity);
    }
  }

  /**
   * Get random rarity based on level
   */
  private getRandomRarity(level: number): ItemRarity {
    const roll = Math.random() * 100;
    const legendaryChance = Math.min(5, level * 0.5);
    const epicChance = Math.min(15, level * 1);
    const rareChance = Math.min(30, level * 2);
    const uncommonChance = 40;

    if (roll < legendaryChance) return ItemRarity.LEGENDARY;
    if (roll < legendaryChance + epicChance) return ItemRarity.EPIC;
    if (roll < legendaryChance + epicChance + rareChance) return ItemRarity.RARE;
    if (roll < legendaryChance + epicChance + rareChance + uncommonChance) return ItemRarity.UNCOMMON;
    return ItemRarity.COMMON;
  }

  /**
   * Get rarity multiplier
   */
  private getRarityMultiplier(rarity: ItemRarity): number {
    switch (rarity) {
      case ItemRarity.COMMON: return 1;
      case ItemRarity.UNCOMMON: return 1.3;
      case ItemRarity.RARE: return 1.7;
      case ItemRarity.EPIC: return 2.2;
      case ItemRarity.LEGENDARY: return 3;
      default: return 1;
    }
  }

  /**
   * Generate a weapon
   */
  generateWeapon(level: number, rarity: ItemRarity): Weapon {
    const baseName = this.weaponNames[Math.floor(Math.random() * this.weaponNames.length)];
    const multiplier = this.getRarityMultiplier(rarity);
    const baseDamage = 5 + level * 2;

    return {
      id: crypto.randomUUID(),
      name: `${rarity} ${baseName}`,
      description: `A ${rarity.toLowerCase()} quality ${baseName.toLowerCase()}`,
      type: ItemType.WEAPON,
      rarity,
      value: Math.floor(10 * level * multiplier),
      damage: Math.floor(baseDamage * multiplier),
      attackSpeed: 1 + Math.random() * 0.5
    };
  }

  /**
   * Generate armor
   */
  generateArmor(level: number, rarity: ItemRarity): Armor {
    const prefix = this.armorPrefixes[Math.floor(Math.random() * this.armorPrefixes.length)];
    const slots: Array<'head' | 'chest' | 'legs' | 'feet'> = ['head', 'chest', 'legs', 'feet'];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const slotNames: Record<string, string> = { head: 'Helmet', chest: 'Chestplate', legs: 'Leggings', feet: 'Boots' };
    const multiplier = this.getRarityMultiplier(rarity);
    const baseDefense = 2 + level;

    return {
      id: crypto.randomUUID(),
      name: `${prefix} ${slotNames[slot]}`,
      description: `${rarity} ${prefix.toLowerCase()} ${slotNames[slot].toLowerCase()}`,
      type: ItemType.ARMOR,
      rarity,
      value: Math.floor(8 * level * multiplier),
      defense: Math.floor(baseDefense * multiplier),
      slot
    };
  }

  /**
   * Generate a consumable
   */
  generateConsumable(level: number, rarity: ItemRarity): Consumable {
    const name = this.consumableNames[Math.floor(Math.random() * this.consumableNames.length)];
    const multiplier = this.getRarityMultiplier(rarity);
    const baseHeal = 20 + level * 5;

    return {
      id: crypto.randomUUID(),
      name: `${rarity} ${name}`,
      description: `Restores health when consumed`,
      type: ItemType.CONSUMABLE,
      rarity,
      value: Math.floor(5 * level * multiplier),
      healAmount: Math.floor(baseHeal * multiplier)
    };
  }

  /**
   * Generate a trinket
   */
  generateTrinket(level: number, rarity: ItemRarity): Trinket {
    const baseName = this.trinketNames[Math.floor(Math.random() * this.trinketNames.length)];
    const multiplier = this.getRarityMultiplier(rarity);
    const statBoost = Math.floor((2 + level) * multiplier);

    const stats = ['strength', 'agility', 'intelligence', 'health'] as const;
    const primaryStat = stats[Math.floor(Math.random() * stats.length)];

    return {
      id: crypto.randomUUID(),
      name: `${rarity} ${baseName}`,
      description: `A magical ${baseName.toLowerCase()} that boosts ${primaryStat}`,
      type: ItemType.TRINKET,
      rarity,
      value: Math.floor(15 * level * multiplier),
      statBonus: {
        [primaryStat]: statBoost
      }
    };
  }

  /**
   * Create a specific weapon
   */
  createWeapon(
    name: string,
    description: string,
    rarity: ItemRarity,
    damage: number,
    attackSpeed: number,
    value: number
  ): Weapon {
    return {
      id: crypto.randomUUID(),
      name,
      description,
      type: ItemType.WEAPON,
      rarity,
      value,
      damage,
      attackSpeed
    };
  }

  /**
   * Create a health potion
   */
  createHealthPotion(size: 'small' | 'medium' | 'large'): Consumable {
    const sizes = {
      small: { heal: 25, value: 10, rarity: ItemRarity.COMMON },
      medium: { heal: 50, value: 25, rarity: ItemRarity.UNCOMMON },
      large: { heal: 100, value: 50, rarity: ItemRarity.RARE }
    };
    const config = sizes[size];

    return {
      id: crypto.randomUUID(),
      name: `${size.charAt(0).toUpperCase() + size.slice(1)} Health Potion`,
      description: `Restores ${config.heal} health`,
      type: ItemType.CONSUMABLE,
      rarity: config.rarity,
      value: config.value,
      healAmount: config.heal
    };
  }

  /**
   * Generate a bag that expands inventory capacity
   */
  generateBag(level: number, rarity: ItemRarity): Bag {
    const baseName = this.bagNames[Math.floor(Math.random() * this.bagNames.length)];
    const multiplier = this.getRarityMultiplier(rarity);
    const baseSlots = 5;
    const slotsGranted = Math.floor(baseSlots * multiplier);

    return {
      id: crypto.randomUUID(),
      name: `${rarity} ${baseName}`,
      description: `A ${rarity.toLowerCase()} quality ${baseName.toLowerCase()} with ${slotsGranted} extra slots`,
      type: ItemType.BAG,
      rarity,
      value: Math.floor(12 * level * multiplier),
      slotsGranted
    };
  }
}
