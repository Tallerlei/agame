import { Injectable, signal, computed } from '@angular/core';
import {
  Character,
  CharacterClass,
  createCharacter,
  calculateExpToNextLevel
} from '../models/character.model';
import { Ability, AbilityType, createBasicAttack } from '../models/ability.model';
import { Item, Weapon, Armor, Trinket, ItemType } from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private _characters = signal<Character[]>([]);
  private _activeCharacter = signal<Character | null>(null);

  characters = this._characters.asReadonly();
  activeCharacter = this._activeCharacter.asReadonly();

  /**
   * Create a new character
   */
  createCharacter(name: string, characterClass: CharacterClass): Character {
    const character = createCharacter(name, characterClass);
    
    // Add class-specific starting abilities
    character.abilities = this.getStartingAbilities(characterClass);
    
    this._characters.update(chars => [...chars, character]);
    
    if (!this._activeCharacter()) {
      this._activeCharacter.set(character);
    }
    
    return character;
  }

  /**
   * Set the active character
   */
  setActiveCharacter(characterId: string): void {
    const character = this._characters().find(c => c.id === characterId);
    if (character) {
      this._activeCharacter.set(character);
    }
  }

  /**
   * Add experience to a character
   */
  addExperience(characterId: string, amount: number): void {
    this._characters.update(chars =>
      chars.map(char => {
        if (char.id !== characterId) return char;

        let newExp = char.experience + amount;
        let newLevel = char.level;
        let expToNext = char.experienceToNextLevel;

        // Level up loop
        while (newExp >= expToNext) {
          newExp -= expToNext;
          newLevel++;
          expToNext = calculateExpToNextLevel(newLevel);
        }

        // Apply stat increases on level up
        const levelUps = newLevel - char.level;
        const newStats = { ...char.stats };
        
        if (levelUps > 0) {
          newStats.maxHealth += 10 * levelUps;
          newStats.currentHealth = newStats.maxHealth;
          newStats.maxMana += 5 * levelUps;
          newStats.currentMana = newStats.maxMana;
          newStats.attackPower += 2 * levelUps;
          newStats.defense += 1 * levelUps;
        }

        const updatedChar = {
          ...char,
          level: newLevel,
          experience: newExp,
          experienceToNextLevel: expToNext,
          stats: newStats
        };

        // Update active character if this is the one
        if (this._activeCharacter()?.id === characterId) {
          this._activeCharacter.set(updatedChar);
        }

        return updatedChar;
      })
    );
  }

  /**
   * Add gold to a character
   */
  addGold(characterId: string, amount: number): void {
    this.updateCharacter(characterId, char => ({
      ...char,
      gold: char.gold + amount
    }));
  }

  /**
   * Add item to inventory
   */
  addItemToInventory(characterId: string, item: Item): boolean {
    let added = false;
    
    this.updateCharacter(characterId, char => {
      if (char.inventory.items.length >= char.inventory.maxSize) {
        return char;
      }
      added = true;
      return {
        ...char,
        inventory: {
          ...char.inventory,
          items: [...char.inventory.items, item]
        }
      };
    });

    return added;
  }

  /**
   * Remove item from inventory
   */
  removeItemFromInventory(characterId: string, itemId: string): boolean {
    let removed = false;

    this.updateCharacter(characterId, char => {
      const itemIndex = char.inventory.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        return char;
      }
      removed = true;
      const newItems = [...char.inventory.items];
      newItems.splice(itemIndex, 1);
      return {
        ...char,
        inventory: {
          ...char.inventory,
          items: newItems
        }
      };
    });

    return removed;
  }

  /**
   * Equip an item
   */
  equipItem(characterId: string, itemId: string): void {
    this.updateCharacter(characterId, char => {
      const itemIndex = char.inventory.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return char;

      const item = char.inventory.items[itemIndex];
      const newEquipment = { ...char.equipment };
      const newInventory = [...char.inventory.items];
      
      // Remove item from inventory
      newInventory.splice(itemIndex, 1);

      // Equip based on type
      if (item.type === ItemType.WEAPON) {
        if (newEquipment.weapon) {
          newInventory.push(newEquipment.weapon);
        }
        newEquipment.weapon = item as Weapon;
      } else if (item.type === ItemType.ARMOR) {
        const armor = item as Armor;
        const currentArmor = newEquipment[armor.slot];
        if (currentArmor) {
          newInventory.push(currentArmor);
        }
        (newEquipment as Record<string, Armor>)[armor.slot] = armor;
      } else if (item.type === ItemType.TRINKET) {
        if (newEquipment.trinket) {
          newInventory.push(newEquipment.trinket);
        }
        newEquipment.trinket = item as Trinket;
      }

      return {
        ...char,
        equipment: newEquipment,
        inventory: { ...char.inventory, items: newInventory }
      };
    });
  }

  /**
   * Heal character
   */
  healCharacter(characterId: string, amount: number): void {
    this.updateCharacter(characterId, char => ({
      ...char,
      stats: {
        ...char.stats,
        currentHealth: Math.min(char.stats.maxHealth, char.stats.currentHealth + amount)
      }
    }));
  }

  /**
   * Increment fights won
   */
  incrementFightsWon(characterId: string): void {
    this.updateCharacter(characterId, char => ({
      ...char,
      fightsWon: char.fightsWon + 1
    }));
  }

  /**
   * Increment quests completed
   */
  incrementQuestsCompleted(characterId: string): void {
    this.updateCharacter(characterId, char => ({
      ...char,
      questsCompleted: char.questsCompleted + 1
    }));
  }

  private updateCharacter(characterId: string, updateFn: (char: Character) => Character): void {
    this._characters.update(chars =>
      chars.map(char => {
        if (char.id !== characterId) return char;
        const updated = updateFn(char);
        
        if (this._activeCharacter()?.id === characterId) {
          this._activeCharacter.set(updated);
        }
        
        return updated;
      })
    );
  }

  private getStartingAbilities(characterClass: CharacterClass): Ability[] {
    const basicAttack = createBasicAttack(10);
    
    switch (characterClass) {
      case CharacterClass.WARRIOR:
        return [
          basicAttack,
          {
            id: 'power-strike',
            name: 'Power Strike',
            description: 'A powerful strike dealing extra damage',
            type: AbilityType.ATTACK,
            damage: 20,
            cooldown: 3,
            currentCooldown: 0,
            manaCost: 15,
            levelRequired: 1
          }
        ];
      case CharacterClass.MAGE:
        return [
          basicAttack,
          {
            id: 'fireball',
            name: 'Fireball',
            description: 'Launch a ball of fire at the enemy',
            type: AbilityType.ATTACK,
            damage: 25,
            cooldown: 2,
            currentCooldown: 0,
            manaCost: 20,
            levelRequired: 1
          }
        ];
      case CharacterClass.ROGUE:
        return [
          basicAttack,
          {
            id: 'backstab',
            name: 'Backstab',
            description: 'Strike from the shadows for critical damage',
            type: AbilityType.ATTACK,
            damage: 30,
            cooldown: 4,
            currentCooldown: 0,
            manaCost: 10,
            levelRequired: 1
          }
        ];
      case CharacterClass.HEALER:
        return [
          basicAttack,
          {
            id: 'heal',
            name: 'Heal',
            description: 'Restore health',
            type: AbilityType.HEAL,
            healAmount: 30,
            cooldown: 3,
            currentCooldown: 0,
            manaCost: 25,
            levelRequired: 1
          }
        ];
      default:
        return [basicAttack];
    }
  }
}
