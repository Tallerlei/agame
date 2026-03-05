import { Injectable, signal } from '@angular/core';
import {
  CombatState,
  CombatLogEntry,
  CombatActionType,
  CombatResult,
  Enemy,
  createEnemy,
  calculateDamage
} from '../models/combat.model';
import { Character } from '../models/character.model';
import { Ability, AbilityType } from '../models/ability.model';
import { CharacterService, LevelUpInfo } from './character.service';
import { ItemService } from './item.service';

export interface CombatEndResult {
  victory: boolean;
  experienceGained: number;
  goldGained: number;
  itemsGained: string[];
  levelUpInfo: LevelUpInfo | null;
}

@Injectable({
  providedIn: 'root'
})
export class CombatService {
  private _combatState = signal<CombatState>({
    isActive: false,
    currentTurn: 'player',
    player: null,
    enemy: null,
    combatLog: [],
    turnCount: 0
  });

  private _lastCombatResult = signal<CombatEndResult | null>(null);

  combatState = this._combatState.asReadonly();
  lastCombatResult = this._lastCombatResult.asReadonly();

  constructor(
    private characterService: CharacterService,
    private itemService: ItemService
  ) {}

  /**
   * Start a new combat encounter
   */
  startCombat(character: Character, enemy: Enemy): void {
    this._combatState.set({
      isActive: true,
      currentTurn: 'player',
      player: character,
      enemy: enemy,
      combatLog: [{
        timestamp: Date.now(),
        attacker: '',
        defender: '',
        action: CombatActionType.ATTACK,
        message: `Combat started! ${character.name} vs ${enemy.name}`
      }],
      turnCount: 1
    });
  }

  /**
   * Start combat with a random enemy
   */
  startRandomCombat(character: Character): void {
    const enemyNames = ['Goblin', 'Orc', 'Skeleton', 'Wolf', 'Bandit', 'Troll'];
    const randomName = enemyNames[Math.floor(Math.random() * enemyNames.length)];
    const enemyLevel = Math.max(1, character.level + Math.floor(Math.random() * 3) - 1);
    
    const enemy = createEnemy(randomName, enemyLevel);
    this.startCombat(character, enemy);
  }

  /**
   * Player attacks with basic attack
   */
  playerAttack(): void {
    const state = this._combatState();
    if (!state.isActive || state.currentTurn !== 'player' || !state.player || !state.enemy) {
      return;
    }

    const damage = calculateDamage(
      state.player.stats.attackPower + (state.player.equipment.weapon?.damage || 0),
      state.enemy.defense
    );

    const newEnemyHealth = Math.max(0, state.enemy.currentHealth - damage);
    const logEntry: CombatLogEntry = {
      timestamp: Date.now(),
      attacker: state.player.name,
      defender: state.enemy.name,
      action: CombatActionType.ATTACK,
      damage,
      message: `${state.player.name} attacks ${state.enemy.name} for ${damage} damage!`
    };

    this._combatState.update(s => ({
      ...s,
      enemy: s.enemy ? { ...s.enemy, currentHealth: newEnemyHealth } : null,
      combatLog: [...s.combatLog, logEntry],
      currentTurn: 'enemy' as const
    }));

    // Check for victory
    if (newEnemyHealth <= 0) {
      this.endCombat(true);
    } else {
      // Enemy turn after a short delay
      setTimeout(() => this.enemyTurn(), 500);
    }
  }

  /**
   * Player uses an ability
   */
  useAbility(ability: Ability): void {
    const state = this._combatState();
    if (!state.isActive || state.currentTurn !== 'player' || !state.player || !state.enemy) {
      return;
    }

    if (ability.currentCooldown > 0) {
      return; // Ability on cooldown
    }

    if (state.player.stats.currentMana < ability.manaCost) {
      return; // Not enough mana
    }

    let logEntry: CombatLogEntry;
    let newEnemyHealth = state.enemy.currentHealth;
    let newPlayerHealth = state.player.stats.currentHealth;

    if (ability.type === AbilityType.ATTACK && ability.damage) {
      const damage = calculateDamage(ability.damage, state.enemy.defense);
      newEnemyHealth = Math.max(0, state.enemy.currentHealth - damage);
      logEntry = {
        timestamp: Date.now(),
        attacker: state.player.name,
        defender: state.enemy.name,
        action: CombatActionType.ABILITY,
        damage,
        message: `${state.player.name} uses ${ability.name} on ${state.enemy.name} for ${damage} damage!`
      };
    } else if (ability.type === AbilityType.HEAL && ability.healAmount) {
      const healing = ability.healAmount;
      newPlayerHealth = Math.min(state.player.stats.maxHealth, newPlayerHealth + healing);
      logEntry = {
        timestamp: Date.now(),
        attacker: state.player.name,
        defender: state.player.name,
        action: CombatActionType.ABILITY,
        healing,
        message: `${state.player.name} uses ${ability.name} and heals for ${healing}!`
      };
    } else {
      return;
    }

    // Update player mana and ability cooldown
    const updatedPlayer = {
      ...state.player,
      stats: {
        ...state.player.stats,
        currentMana: state.player.stats.currentMana - ability.manaCost,
        currentHealth: newPlayerHealth
      },
      abilities: state.player.abilities.map(a =>
        a.id === ability.id ? { ...a, currentCooldown: a.cooldown } : a
      )
    };

    this._combatState.update(s => ({
      ...s,
      player: updatedPlayer,
      enemy: s.enemy ? { ...s.enemy, currentHealth: newEnemyHealth } : null,
      combatLog: [...s.combatLog, logEntry],
      currentTurn: 'enemy' as const
    }));

    if (newEnemyHealth <= 0) {
      this.endCombat(true);
    } else {
      setTimeout(() => this.enemyTurn(), 500);
    }
  }

  /**
   * Enemy's turn
   */
  private enemyTurn(): void {
    const state = this._combatState();
    if (!state.isActive || !state.player || !state.enemy) {
      return;
    }

    const playerDefense = state.player.stats.defense +
      (state.player.equipment.chest?.defense || 0) +
      (state.player.equipment.head?.defense || 0) +
      (state.player.equipment.legs?.defense || 0) +
      (state.player.equipment.feet?.defense || 0);

    const damage = calculateDamage(state.enemy.attackPower, playerDefense);
    const newPlayerHealth = Math.max(0, state.player.stats.currentHealth - damage);

    const logEntry: CombatLogEntry = {
      timestamp: Date.now(),
      attacker: state.enemy.name,
      defender: state.player.name,
      action: CombatActionType.ATTACK,
      damage,
      message: `${state.enemy.name} attacks ${state.player.name} for ${damage} damage!`
    };

    // Reduce ability cooldowns
    const updatedAbilities = state.player.abilities.map(a => ({
      ...a,
      currentCooldown: Math.max(0, a.currentCooldown - 1)
    }));

    this._combatState.update(s => ({
      ...s,
      player: s.player ? {
        ...s.player,
        stats: { ...s.player.stats, currentHealth: newPlayerHealth },
        abilities: updatedAbilities
      } : null,
      combatLog: [...s.combatLog, logEntry],
      currentTurn: 'player' as const,
      turnCount: s.turnCount + 1
    }));

    if (newPlayerHealth <= 0) {
      this.endCombat(false);
    }
  }

  /**
   * Try to flee from combat
   */
  flee(): boolean {
    const state = this._combatState();
    if (!state.isActive) return false;

    const fleeChance = 0.5; // 50% chance to flee
    const success = Math.random() < fleeChance;

    if (success) {
      const logEntry: CombatLogEntry = {
        timestamp: Date.now(),
        attacker: '',
        defender: '',
        action: CombatActionType.FLEE,
        message: `${state.player?.name} successfully fled from combat!`
      };

      this._combatState.update(s => ({
        ...s,
        combatLog: [...s.combatLog, logEntry],
        isActive: false
      }));
    } else {
      const logEntry: CombatLogEntry = {
        timestamp: Date.now(),
        attacker: '',
        defender: '',
        action: CombatActionType.FLEE,
        message: `${state.player?.name} failed to flee!`
      };

      this._combatState.update(s => ({
        ...s,
        combatLog: [...s.combatLog, logEntry],
        currentTurn: 'enemy' as const
      }));

      setTimeout(() => this.enemyTurn(), 500);
    }

    return success;
  }

  /**
   * End the combat
   */
  private endCombat(victory: boolean): void {
    const state = this._combatState();
    if (!state.player || !state.enemy) return;

    let message: string;

    if (victory) {
      const expGained = state.enemy.experienceReward;
      const goldGained = state.enemy.goldReward;
      
      // Update character with rewards
      const levelUpInfo = this.characterService.addExperience(state.player.id, expGained);
      this.characterService.addGold(state.player.id, goldGained);
      this.characterService.incrementFightsWon(state.player.id);

      // Chance to drop item
      const itemDropped = Math.random() < 0.3; // 30% drop chance
      const droppedItems: string[] = [];
      
      if (itemDropped) {
        const item = this.itemService.generateRandomItem(state.enemy.level);
        this.characterService.addItemToInventory(state.player.id, item);
        droppedItems.push(item.name);
      }

      message = `Victory! ${state.player.name} defeated ${state.enemy.name}! Gained ${expGained} XP and ${goldGained} gold.`;
      if (droppedItems.length > 0) {
        message += ` Found: ${droppedItems.join(', ')}`;
      }

      this._lastCombatResult.set({
        victory: true,
        experienceGained: expGained,
        goldGained: goldGained,
        itemsGained: droppedItems,
        levelUpInfo
      });
    } else {
      message = `Defeat! ${state.player.name} was defeated by ${state.enemy.name}!`;
      this._lastCombatResult.set({
        victory: false,
        experienceGained: 0,
        goldGained: 0,
        itemsGained: [],
        levelUpInfo: null
      });
    }

    const logEntry: CombatLogEntry = {
      timestamp: Date.now(),
      attacker: '',
      defender: '',
      action: CombatActionType.ATTACK,
      message
    };

    this._combatState.update(s => ({
      ...s,
      combatLog: [...s.combatLog, logEntry],
      isActive: false
    }));
  }

  /**
   * Reset combat state
   */
  resetCombat(): void {
    this._combatState.set({
      isActive: false,
      currentTurn: 'player',
      player: null,
      enemy: null,
      combatLog: [],
      turnCount: 0
    });
    this._lastCombatResult.set(null);
  }

  /**
   * Dismiss the last combat result
   */
  dismissCombatResult(): void {
    this._lastCombatResult.set(null);
  }
}
