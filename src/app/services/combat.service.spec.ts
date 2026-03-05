import { TestBed } from '@angular/core/testing';
import { CombatService } from './combat.service';
import { CharacterService } from './character.service';
import { ItemService } from './item.service';
import { CharacterClass, createCharacter } from '../models/character.model';
import { ItemType, ItemRarity, Consumable } from '../models/item.model';
import { createEnemy } from '../models/combat.model';

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
});
