import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CombatService } from '../../services/combat.service';
import { CharacterService } from '../../services/character.service';
import { QuestService } from '../../services/quest.service';
import { Ability, AbilityType } from '../../models/ability.model';

@Component({
  selector: 'app-combat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="combat-container">
      @if (!combatState().isActive) {
        <div class="combat-start">
          <h2>⚔️ Battle Arena</h2>
          <p>Ready for combat?</p>
          <button
            class="fight-btn"
            (click)="startFight()"
            [disabled]="!canFight()"
          >
            Find Opponent
          </button>
        </div>
      } @else {
        <div class="combat-arena">
          <!-- Enemy Section -->
          <div class="combatant enemy">
            <h3>{{ combatState().enemy?.name }}</h3>
            <span class="level">Lv. {{ combatState().enemy?.level }}</span>
            <div class="health-bar">
              <div
                class="health-fill"
                [style.width.%]="getEnemyHealthPercent()"
              ></div>
              <span class="health-text">
                {{ combatState().enemy?.currentHealth }} / {{ combatState().enemy?.maxHealth }}
              </span>
            </div>
          </div>

          <div class="vs-indicator">VS</div>

          <!-- Player Section -->
          <div class="combatant player">
            <h3>{{ combatState().player?.name }}</h3>
            <span class="level">Lv. {{ combatState().player?.level }}</span>
            <div class="health-bar">
              <div
                class="health-fill"
                [style.width.%]="getPlayerHealthPercent()"
              ></div>
              <span class="health-text">
                {{ combatState().player?.stats?.currentHealth }} / {{ combatState().player?.stats?.maxHealth }}
              </span>
            </div>
            <div class="mana-bar">
              <div
                class="mana-fill"
                [style.width.%]="getPlayerManaPercent()"
              ></div>
              <span class="mana-text">
                {{ combatState().player?.stats?.currentMana }} / {{ combatState().player?.stats?.maxMana }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="actions" [class.disabled]="combatState().currentTurn !== 'player'">
            <button class="action-btn attack" (click)="attack()">
              ⚔️ Attack
            </button>
            
            @for (ability of getUsableAbilities(); track ability.id) {
              <button
                class="action-btn ability"
                [class.on-cooldown]="ability.currentCooldown > 0"
                [disabled]="ability.currentCooldown > 0 || !canUseAbility(ability)"
                (click)="useAbility(ability)"
              >
                {{ getAbilityIcon(ability) }} {{ ability.name }}
                @if (ability.currentCooldown > 0) {
                  <span class="cooldown">({{ ability.currentCooldown }})</span>
                }
              </button>
            }

            <button class="action-btn flee" (click)="flee()">
              🏃 Flee
            </button>
          </div>

          <!-- Combat Log -->
          <div class="combat-log">
            <h4>Combat Log</h4>
            <div class="log-entries">
              @for (entry of combatState().combatLog.slice(-5); track entry.timestamp) {
                <div class="log-entry">{{ entry.message }}</div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .combat-container {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 1.5rem;
      min-height: 400px;
    }

    .combat-start {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      text-align: center;
    }

    .combat-start h2 {
      color: #ffd700;
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .combat-start p {
      color: #a0a0a0;
      margin-bottom: 2rem;
    }

    .fight-btn {
      padding: 1rem 3rem;
      font-size: 1.2rem;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      color: white;
      cursor: pointer;
      transition: all 0.3s;
    }

    .fight-btn:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 20px rgba(231, 76, 60, 0.4);
    }

    .fight-btn:disabled {
      background: #4a4a6a;
      cursor: not-allowed;
    }

    .combat-arena {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .combatant {
      padding: 1rem;
      border-radius: 8px;
      background: #2a2a4a;
    }

    .combatant.enemy {
      border-left: 4px solid #e74c3c;
    }

    .combatant.player {
      border-left: 4px solid #3498db;
    }

    .combatant h3 {
      margin: 0 0 0.25rem 0;
      color: #fff;
    }

    .combatant .level {
      color: #ffd700;
      font-size: 0.85rem;
    }

    .health-bar, .mana-bar {
      height: 24px;
      background: #1a1a2e;
      border-radius: 12px;
      margin-top: 0.5rem;
      position: relative;
      overflow: hidden;
    }

    .health-fill {
      height: 100%;
      background: linear-gradient(90deg, #e74c3c 0%, #c0392b 100%);
      transition: width 0.3s;
    }

    .mana-fill {
      height: 100%;
      background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
      transition: width 0.3s;
    }

    .health-text, .mana-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 0.75rem;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .vs-indicator {
      text-align: center;
      font-size: 1.5rem;
      font-weight: bold;
      color: #ffd700;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 1rem;
      background: #2a2a4a;
      border-radius: 8px;
    }

    .actions.disabled {
      opacity: 0.6;
      pointer-events: none;
    }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn.attack {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      color: white;
    }

    .action-btn.ability {
      background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
      color: white;
    }

    .action-btn.ability.on-cooldown {
      background: #4a4a6a;
      cursor: not-allowed;
    }

    .action-btn.flee {
      background: linear-gradient(135deg, #f39c12 0%, #d68910 100%);
      color: white;
    }

    .action-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }

    .cooldown {
      margin-left: 0.25rem;
      opacity: 0.7;
    }

    .combat-log {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 1rem;
    }

    .combat-log h4 {
      margin: 0 0 0.5rem 0;
      color: #ffd700;
      font-size: 0.9rem;
    }

    .log-entries {
      max-height: 150px;
      overflow-y: auto;
    }

    .log-entry {
      padding: 0.25rem 0;
      color: #a0a0a0;
      font-size: 0.85rem;
      border-bottom: 1px solid #2a2a4a;
    }

    .log-entry:last-child {
      border-bottom: none;
      color: #fff;
    }
  `]
})
export class CombatComponent {
  private combatService = inject(CombatService);
  private characterService = inject(CharacterService);
  private questService = inject(QuestService);

  combatState = this.combatService.combatState;

  canFight(): boolean {
    return this.characterService.activeCharacter() !== null;
  }

  startFight(): void {
    const character = this.characterService.activeCharacter();
    if (character) {
      this.combatService.startRandomCombat(character);
    }
  }

  attack(): void {
    this.combatService.playerAttack();
    this.checkVictory();
  }

  useAbility(ability: Ability): void {
    this.combatService.useAbility(ability);
    this.checkVictory();
  }

  flee(): void {
    this.combatService.flee();
  }

  private checkVictory(): void {
    const state = this.combatState();
    if (!state.isActive && state.enemy?.currentHealth === 0) {
      // Record quest progress with the enemy name for type-specific objectives
      this.questService.recordEnemyDefeat(state.enemy.name);
    }
  }

  getUsableAbilities(): Ability[] {
    return this.combatState().player?.abilities.filter(a => a.id !== 'basic-attack') || [];
  }

  canUseAbility(ability: Ability): boolean {
    const player = this.combatState().player;
    if (!player) return false;
    return player.stats.currentMana >= ability.manaCost;
  }

  getAbilityIcon(ability: Ability): string {
    switch (ability.type) {
      case AbilityType.ATTACK: return '💥';
      case AbilityType.HEAL: return '💚';
      case AbilityType.BUFF: return '⬆️';
      case AbilityType.DEBUFF: return '⬇️';
      default: return '✨';
    }
  }

  getEnemyHealthPercent(): number {
    const enemy = this.combatState().enemy;
    if (!enemy) return 0;
    return (enemy.currentHealth / enemy.maxHealth) * 100;
  }

  getPlayerHealthPercent(): number {
    const player = this.combatState().player;
    if (!player) return 0;
    return (player.stats.currentHealth / player.stats.maxHealth) * 100;
  }

  getPlayerManaPercent(): number {
    const player = this.combatState().player;
    if (!player) return 0;
    return (player.stats.currentMana / player.stats.maxMana) * 100;
  }
}
