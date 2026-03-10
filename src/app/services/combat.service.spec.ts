import { TestBed } from '@angular/core/testing';
import { CombatService } from './combat.service';
import { CharacterService } from './character.service';
import { ItemService } from './item.service';
import { CharacterClass, createCharacter } from '../models/character.model';
import { ItemType, ItemRarity, Consumable } from '../models/item.model';
import { createEnemy } from '../models/combat.model';
import { Ability, AbilityType } from '../models/ability.model';

describe('CombatService', () => {
  let service: CombatService;
  let characterService: CharacterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CombatService, CharacterService, ItemService]
    });
    service = TestBed.inject(CombatService);
    characterService = TestBed.inject(CharacterService);
  });

  function makeConsumable(healAmount: number): Consumable {
    return {
      id: crypto.randomUUID(),
      name: 'Small Health Potion',
      description: 'Restores health',
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      value: 10,
      healAmount
    };
  }

  function startCombatWithCharacter(damageToPlayer = 0): void {
    const character = createCharacter('Hero', CharacterClass.WARRIOR);
    if (damageToPlayer > 0) {
      character.stats.currentHealth = Math.max(1, character.stats.currentHealth - damageToPlayer);
    }
    const enemy = createEnemy('Goblin', 1);
    service.startCombat(character, enemy);
  }

  function makeAttackAbility(damage: number): Ability {
    return {
      id: 'test-attack',
      name: 'Test Strike',
      description: 'A test attack',
      type: AbilityType.ATTACK,
      damage,
      cooldown: 3,
      currentCooldown: 0,
      manaCost: 10,
      levelRequired: 1
    };
  }

  function makeHealAbility(healAmount: number): Ability {
    return {
      id: 'test-heal',
      name: 'Test Heal',
      description: 'A test heal',
      type: AbilityType.HEAL,
      healAmount,
      cooldown: 3,
      currentCooldown: 0,
      manaCost: 10,
      levelRequired: 1
    };
  }

  describe('useConsumable', () => {
    it('should heal the player by the consumable healAmount', () => {
      startCombatWithCharacter(50);
      const potion = makeConsumable(30);
      const healthBefore = service.combatState().player!.stats.currentHealth;

      service.useConsumable(potion);

      const healthAfter = service.combatState().player!.stats.currentHealth;
      expect(healthAfter).toBe(Math.min(
        service.combatState().player!.stats.maxHealth,
        healthBefore + 30
      ));
    });

    it('should not heal above max health', () => {
      startCombatWithCharacter(0);
      const potion = makeConsumable(9999);

      service.useConsumable(potion);

      const player = service.combatState().player!;
      expect(player.stats.currentHealth).toBe(player.stats.maxHealth);
    });

    it('should remove the consumable from the player inventory in combat state', () => {
      const character = createCharacter('Hero', CharacterClass.WARRIOR);
      const potion = makeConsumable(25);
      character.inventory.items.push(potion);
      const enemy = createEnemy('Goblin', 1);
      service.startCombat(character, enemy);

      service.useConsumable(potion);

      const itemsAfter = service.combatState().player!.inventory.items;
      expect(itemsAfter.find(i => i.id === potion.id)).toBeUndefined();
    });

    it('should add a log entry describing the heal', () => {
      startCombatWithCharacter(30);
      const potion = makeConsumable(20);
      const logLengthBefore = service.combatState().combatLog.length;

      service.useConsumable(potion);

      const log = service.combatState().combatLog;
      expect(log.length).toBeGreaterThan(logLengthBefore);
      expect(log[log.length - 1].message).toContain('20');
    });

    it('should pass the turn to the enemy after using a consumable', () => {
      startCombatWithCharacter(0);
      const potion = makeConsumable(10);
      expect(service.combatState().currentTurn).toBe('player');

      service.useConsumable(potion);

      expect(service.combatState().currentTurn).toBe('enemy');
    });

    it('should do nothing when combat is not active', () => {
      const potion = makeConsumable(50);
      const stateBefore = service.combatState();

      service.useConsumable(potion);

      expect(service.combatState()).toEqual(stateBefore);
    });

    it('should do nothing when it is not the player turn', () => {
      startCombatWithCharacter(0);
      const potion = makeConsumable(50);
      // Force enemy turn
      service['_combatState'].update(s => ({ ...s, currentTurn: 'enemy' as const }));

      const healthBefore = service.combatState().player!.stats.currentHealth;
      service.useConsumable(potion);

      expect(service.combatState().player!.stats.currentHealth).toBe(healthBefore);
    });

    it('should do nothing if the item has no healAmount', () => {
      startCombatWithCharacter(0);
      const brokenPotion: Consumable = {
        id: crypto.randomUUID(),
        name: 'Empty Flask',
        description: 'Nothing in it',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        value: 1
      };

      const healthBefore = service.combatState().player!.stats.currentHealth;
      service.useConsumable(brokenPotion);

      expect(service.combatState().player!.stats.currentHealth).toBe(healthBefore);
    });
  });

  describe('useAbility – spell scaling', () => {
    it('should deal more damage than the base ability.damage for a Mage due to intelligence scaling', () => {
      const mage = createCharacter('Mage', CharacterClass.MAGE);
      // Mage starts with intelligence 18, scaling bonus = floor(18 * 0.5) = 9
      mage.stats.currentMana = 100;
      const enemy = createEnemy('Goblin', 1);
      enemy.defense = 0; // No defense so damage = scaledDamage exactly (minus small variance)
      service.startCombat(mage, enemy);

      const ability = makeAttackAbility(10);
      service.useAbility(ability);

      const log = service.combatState().combatLog;
      const entry = log[log.length - 1];
      // scaling bonus = floor(18 * 0.5) = 9, scaledDamage = 10 + 9 = 19
      // damage should be at least 1 and message should show scaling info
      expect(entry.message).toContain('scaling');
      expect(entry.message).toContain('9'); // scaling bonus
    });

    it('should deal more damage than base for a Warrior due to strength scaling', () => {
      const warrior = createCharacter('Warrior', CharacterClass.WARRIOR);
      // Warrior starts with strength 15, scaling bonus = floor(15 * 0.5) = 7
      warrior.stats.currentMana = 100;
      const enemy = createEnemy('Goblin', 1);
      enemy.defense = 0;
      service.startCombat(warrior, enemy);

      const ability = makeAttackAbility(10);
      service.useAbility(ability);

      const log = service.combatState().combatLog;
      const entry = log[log.length - 1];
      expect(entry.message).toContain('scaling');
      expect(entry.message).toContain('7'); // scaling bonus
    });

    it('should deal more damage than base for a Rogue due to agility scaling', () => {
      const rogue = createCharacter('Rogue', CharacterClass.ROGUE);
      // Rogue starts with agility 18, scaling bonus = floor(18 * 0.5) = 9
      rogue.stats.currentMana = 100;
      const enemy = createEnemy('Goblin', 1);
      enemy.defense = 0;
      service.startCombat(rogue, enemy);

      const ability = makeAttackAbility(10);
      service.useAbility(ability);

      const log = service.combatState().combatLog;
      const entry = log[log.length - 1];
      expect(entry.message).toContain('scaling');
      expect(entry.message).toContain('9'); // scaling bonus
    });

    it('should scale heal abilities with intelligence for a Healer', () => {
      const healer = createCharacter('Healer', CharacterClass.HEALER);
      // Healer starts with intelligence 15, scaling bonus = floor(15 * 0.5) = 7
      healer.stats.currentMana = 100;
      healer.stats.currentHealth = 50;
      const enemy = createEnemy('Goblin', 1);
      service.startCombat(healer, enemy);

      const healAbility = makeHealAbility(20);
      service.useAbility(healAbility);

      const log = service.combatState().combatLog;
      const entry = log[log.length - 1];
      // Healing = 20 + 7 = 27
      expect(entry.healing).toBe(27);
      expect(entry.message).toContain('27');
      expect(entry.message).toContain('scaling');
    });

    it('should log the base damage and scaling bonus separately in the message', () => {
      const mage = createCharacter('Mage', CharacterClass.MAGE);
      mage.stats.currentMana = 100;
      const enemy = createEnemy('Goblin', 1);
      enemy.defense = 0;
      service.startCombat(mage, enemy);

      const ability = makeAttackAbility(30); // like Ice Lance
      service.useAbility(ability);

      const entry = service.combatState().combatLog.at(-1)!;
      expect(entry.message).toContain('base 30');
    });
  });
});
