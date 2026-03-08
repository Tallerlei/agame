import { Injectable, signal, computed } from '@angular/core';
import {
  Character,
  CharacterClass,
  createCharacter,
  calculateExpToNextLevel,
  canEquipItem
} from '../models/character.model';
import { Ability, AbilityType, createBasicAttack } from '../models/ability.model';
import { Item, Weapon, Armor, Trinket, Bag, ItemType, BodyPartItem } from '../models/item.model';
import { SkillDefinition, getSkillChoicesForLevel } from '../models/skill.model';
import {
  ActiveTrait,
  TraitDefinition,
  TRAIT_DEFINITIONS
} from '../models/trait.model';

export interface LevelUpInfo {
  levelsGained: number;
  oldLevel: number;
  newLevel: number;
  hpGained: number;
  mpGained: number;
  attackGained: number;
  defenseGained: number;
}

/** Result returned from consumeBodyPart */
export interface BodyPartConsumeResult {
  success: boolean;
  wasBlind: boolean;
  traitDefinition?: TraitDefinition;
  negativeTriggered: boolean;
  atTraitCap: boolean;
  alreadyHasTrait: boolean;
  message: string;
}

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
   * Add experience to a character. Returns LevelUpInfo if a level-up occurred, or null otherwise.
   */
  addExperience(characterId: string, amount: number): LevelUpInfo | null {
    let levelUpInfo: LevelUpInfo | null = null;

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
          const hpGained = 10 * levelUps;
          const mpGained = 5 * levelUps;
          const attackGained = 2 * levelUps;
          const defenseGained = 1 * levelUps;

          newStats.maxHealth += hpGained;
          newStats.currentHealth = newStats.maxHealth;
          newStats.maxMana += mpGained;
          newStats.currentMana = newStats.maxMana;
          newStats.attackPower += attackGained;
          newStats.defense += defenseGained;

          levelUpInfo = {
            levelsGained: levelUps,
            oldLevel: char.level,
            newLevel,
            hpGained,
            mpGained,
            attackGained,
            defenseGained
          };
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

    return levelUpInfo;
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
   * Equip an item.
   * Returns { success: true } on success or { success: false, reason } if the
   * character's class is not allowed to use the item.
   */
  equipItem(characterId: string, itemId: string): { success: boolean; reason?: string } {
    let result: { success: boolean; reason?: string } = { success: false };

    this.updateCharacter(characterId, char => {
      const itemIndex = char.inventory.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return char;

      const item = char.inventory.items[itemIndex];

      // Class restriction check
      const equipCheck = canEquipItem(char, item);
      if (!equipCheck.canEquip) {
        result = { success: false, reason: equipCheck.reason };
        return char;
      }

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
      } else if (item.type === ItemType.BAG) {
        const bag = item as Bag;
        if (newEquipment.bag) {
          // Return old bag to inventory; maxSize will shrink but existing items are kept
          newInventory.push(newEquipment.bag);
        }
        newEquipment.bag = bag;
      }

      const BASE_INVENTORY_SIZE = 10;
      const newMaxSize = BASE_INVENTORY_SIZE + (newEquipment.bag?.slotsGranted ?? 0);

      result = { success: true };
      return {
        ...char,
        equipment: newEquipment,
        inventory: { ...char.inventory, items: newInventory, maxSize: newMaxSize }
      };
    });

    return result;
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

  /**
   * Get serializable state for save game
   */
  getState(): { characters: Character[]; activeCharacterId: string | null } {
    return {
      characters: this._characters(),
      activeCharacterId: this._activeCharacter()?.id ?? null
    };
  }

  /**
   * Load state from save game (with backward-compatibility for legacy saves)
   */
  loadState(characters: Character[], activeCharacterId: string | null): void {
    const migrated = characters.map(c => ({
      ...c,
      unlockedSkillIds: c.unlockedSkillIds ?? [],
      traits: c.traits ?? []
    }));
    this._characters.set(migrated);
    const active = migrated.find(c => c.id === activeCharacterId) ?? null;
    this._activeCharacter.set(active);
  }

  // ─── Skill system ────────────────────────────────────────────────────────────

  /**
   * Return the 3 skill choices available to a character at the given level milestone.
   */
  getSkillChoicesForLevel(character: Character, level: number): SkillDefinition[] {
    return getSkillChoicesForLevel(character.characterClass, level, character.unlockedSkillIds);
  }

  /**
   * Permanently learn a skill.
   * Active skills are added to the abilities array for combat use.
   * Passive skills immediately apply their stat bonuses.
   */
  learnSkill(characterId: string, skill: SkillDefinition): void {
    this.updateCharacter(characterId, char => {
      const newAbility: Ability = {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        type: skill.abilityType,
        damage: skill.damage,
        healAmount: skill.healAmount,
        cooldown: skill.cooldownTurns,
        currentCooldown: 0,
        manaCost: skill.manaCost,
        levelRequired: skill.levelRequired,
        isSkill: true,
        isPassive: skill.isPassive,
        passiveBonus: skill.passiveBonus,
        isAoe: skill.isAoe
      };

      const newStats = { ...char.stats };
      if (skill.isPassive && skill.passiveBonus) {
        const b = skill.passiveBonus;
        if (b.strength)     newStats.strength     += b.strength;
        if (b.agility)      newStats.agility       += b.agility;
        if (b.intelligence) newStats.intelligence  += b.intelligence;
        if (b.defense)      newStats.defense       += b.defense;
        if (b.attackPower)  newStats.attackPower   += b.attackPower;
        if (b.maxHealth) {
          newStats.maxHealth    += b.maxHealth;
          newStats.currentHealth = Math.min(newStats.currentHealth + b.maxHealth, newStats.maxHealth);
        }
      }

      return {
        ...char,
        abilities: [...char.abilities, newAbility],
        unlockedSkillIds: [...char.unlockedSkillIds, skill.id],
        stats: newStats
      };
    });
  }

  // ─── Trait system ─────────────────────────────────────────────────────────────

  /**
   * Consume a body part item from inventory.
   * First consumption is "blind" – effects are revealed from the second time onwards.
   * Returns details about what happened so the UI can show feedback.
   *
   * Limits: max 5 traits; duplicate trait types (same definitionId) are not re-added
   * as separate entries – instead the existing one counts the consumption.
   */
  consumeBodyPart(characterId: string, item: BodyPartItem): BodyPartConsumeResult {
    let result: BodyPartConsumeResult = {
      success: false,
      wasBlind: false,
      negativeTriggered: false,
      atTraitCap: false,
      alreadyHasTrait: false,
      message: ''
    };

    const def = TRAIT_DEFINITIONS.find(t => t.id === item.traitDefinitionId);
    if (!def) {
      result.message = 'Unknown body part.';
      return result;
    }

    this.updateCharacter(characterId, char => {
      const wasBlind = item.timesConsumed === 0;

      // Check trait cap
      const existingTrait = char.traits.find(t => t.definitionId === def.id);
      if (!existingTrait && char.traits.length >= 5) {
        result = { ...result, atTraitCap: true, wasBlind, traitDefinition: def, message: 'Trait limit (5) reached!' };
        return char;
      }

      // Roll for negative effect
      const negativeTriggered = Math.random() < def.negativeEffect.chance;
      const newStats = { ...char.stats };

      // Apply positive effect permanently
      this.applyStatDelta(newStats, def.positiveEffect.stat, def.positiveEffect.amount);

      // Apply negative effect if triggered
      if (negativeTriggered && def.negativeEffect.durationFights === 0) {
        // Tiny permanent penalty
        this.applyStatDelta(newStats, def.negativeEffect.stat, -def.negativeEffect.amount);
      }

      // Update or add trait entry
      let newTraits: ActiveTrait[];
      if (existingTrait) {
        newTraits = char.traits.map(t =>
          t.definitionId === def.id
            ? {
                ...t,
                consumeCount: t.consumeCount + 1,
                negativeDebuffActive: negativeTriggered && def.negativeEffect.durationFights > 0,
                negativeDebuffRemainingFights: negativeTriggered && def.negativeEffect.durationFights > 0
                  ? def.negativeEffect.durationFights
                  : t.negativeDebuffRemainingFights
              }
            : t
        );
      } else {
        const newTrait: ActiveTrait = {
          definitionId: def.id,
          name: def.name,
          rarity: def.rarity,
          riskLevel: def.riskLevel,
          positiveEffect: def.positiveEffect,
          negativeEffect: def.negativeEffect,
          negativeDebuffActive: negativeTriggered && def.negativeEffect.durationFights > 0,
          negativeDebuffRemainingFights: negativeTriggered && def.negativeEffect.durationFights > 0
            ? def.negativeEffect.durationFights
            : 0,
          consumeCount: 1,
          spriteMod: def.spriteMod
        };
        newTraits = [...char.traits, newTrait];
      }

      // Remove body part from inventory
      const newItems = char.inventory.items.filter(i => i.id !== item.id);

      result = {
        success: true,
        wasBlind,
        traitDefinition: def,
        negativeTriggered,
        atTraitCap: false,
        alreadyHasTrait: !!existingTrait,
        message: wasBlind
          ? `Unknown – Risk: ${def.riskLevel === 'low' ? 'Low' : def.riskLevel === 'medium' ? 'Medium' : 'High'}`
          : `${def.name} consumed: +${def.positiveEffect.amount} ${def.positiveEffect.stat}${negativeTriggered ? ` (Debuff active: -${def.negativeEffect.amount} ${def.negativeEffect.stat} for ${def.negativeEffect.durationFights} fights)` : ''}`
      };

      return {
        ...char,
        stats: newStats,
        traits: newTraits,
        inventory: { ...char.inventory, items: newItems }
      };
    });

    return result;
  }

  /**
   * Decrement the fight counter on active trait debuffs.
   * Called after each combat ends.
   */
  decrementTraitFights(characterId: string): void {
    this.updateCharacter(characterId, char => {
      const newTraits = char.traits.map(t => {
        if (!t.negativeDebuffActive || t.negativeDebuffRemainingFights <= 0) return t;
        const remaining = t.negativeDebuffRemainingFights - 1;
        return {
          ...t,
          negativeDebuffRemainingFights: remaining,
          negativeDebuffActive: remaining > 0
        };
      });
      return { ...char, traits: newTraits };
    });
  }

  private applyStatDelta(stats: Record<string, number>, stat: string, delta: number): void {
    if (stats[stat] !== undefined) {
      stats[stat] = Math.max(0, stats[stat] + delta);
    }
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
