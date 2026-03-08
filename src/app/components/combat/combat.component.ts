import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CombatService, CombatEndResult } from '../../services/combat.service';
import { CharacterService } from '../../services/character.service';
import { Ability, AbilityType } from '../../models/ability.model';
import { ItemType, Consumable, BodyPartItem } from '../../models/item.model';
import { SkillDefinition } from '../../models/skill.model';

@Component({
  selector: 'app-combat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="combat-container">
      <!-- Combat Result / Level-Up / Skill-Selection Overlay -->
      @if (lastCombatResult(); as result) {
        <div class="result-overlay">
          <div class="result-modal" [class.victory]="result.victory" [class.defeat]="!result.victory">

            <!-- Skill Selection Mode -->
            @if (result.pendingSkillChoices && result.pendingSkillChoices.length > 0 && !skillChosen) {
              <div class="skill-selection">
                <h2>🌟 Level {{ result.skillSelectionLevel }} erreicht!</h2>
                <p class="skill-prompt">Wähle einen neuen Skill:</p>
                <div class="skill-choices">
                  @for (skill of result.pendingSkillChoices; track skill.id) {
                    <button class="skill-choice-btn" [class.passive]="skill.isPassive" (click)="selectSkill(skill, result)">
                      <span class="skill-icon">{{ skill.isPassive ? '🛡️' : skill.abilityType === 'HEAL' ? '💚' : '💥' }}</span>
                      <span class="skill-name">{{ skill.name }}</span>
                      <span class="skill-tag">{{ skill.isPassive ? 'Passiv' : 'Aktiv' }}{{ skill.isAoe ? ' · AoE' : '' }}</span>
                      <span class="skill-desc">{{ skill.description }}</span>
                    </button>
                  }
                </div>
              </div>
            } @else if (skillLearnedName) {
              <!-- Skill Learned Confirmation -->
              <div class="skill-learned">
                <h2>✅ Skill erlernt!</h2>
                <p class="learned-name">{{ skillLearnedName }}</p>
                <button class="dismiss-btn" (click)="dismissResult()">Weiter</button>
              </div>
            } @else {
              <!-- Normal Victory / Defeat -->
              <h2>{{ result.victory ? '⚔️ Victory!' : '💀 Defeat!' }}</h2>

              @if (result.victory) {
                @if (result.isBossKill) {
                  <div class="boss-kill-banner">💀 Boss Vanquished!</div>
                }
                <div class="rewards-summary">
                  <div class="reward-row">
                    <span>⭐ Experience:</span>
                    <span class="reward-val">+{{ result.experienceGained }} XP</span>
                  </div>
                  <div class="reward-row">
                    <span>💰 Gold:</span>
                    <span class="reward-val">+{{ result.goldGained }}</span>
                  </div>
                  @if (result.itemsGained.length > 0) {
                    <div class="reward-row">
                      <span>🎁 Items:</span>
                      <span class="reward-val">{{ result.itemsGained.join(', ') }}</span>
                    </div>
                  }
                  @if (result.bodyPartsGained && result.bodyPartsGained.length > 0) {
                    <div class="reward-row body-part">
                      <span>🧬 Körperteil:</span>
                      <span class="reward-val">{{ result.bodyPartsGained.join(', ') }}</span>
                    </div>
                  }
                  @if (result.questItemsGained && result.questItemsGained.length > 0) {
                    <div class="reward-row quest-item">
                      <span>📦 Quest Item:</span>
                      <span class="reward-val">{{ result.questItemsGained.join(', ') }}</span>
                    </div>
                  }
                </div>

                @if (result.levelUpInfo; as lu) {
                  <div class="level-up-section">
                    <div class="level-up-header">🎉 Level Up!</div>
                    <div class="level-up-badge">Lv. {{ lu.oldLevel }} → Lv. {{ lu.newLevel }}</div>
                    <div class="stat-changes">
                      <div class="stat-change"><span>❤️ Max HP</span><span class="gain">+{{ lu.hpGained }}</span></div>
                      <div class="stat-change"><span>💧 Max MP</span><span class="gain">+{{ lu.mpGained }}</span></div>
                      <div class="stat-change"><span>⚔️ Attack</span><span class="gain">+{{ lu.attackGained }}</span></div>
                      <div class="stat-change"><span>🛡️ Defense</span><span class="gain">+{{ lu.defenseGained }}</span></div>
                    </div>
                  </div>
                }
              } @else {
                <p class="defeat-text">Better luck next time!</p>
              }

              <button class="dismiss-btn" (click)="dismissResult()">Continue</button>
            }
          </div>
        </div>
      }

      @if (!combatState().isActive && !lastCombatResult()) {
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
      } @else if (combatState().isActive) {
        <div class="combat-arena">
          <!-- Enemy Section -->
          <div class="combatant enemy" [class.boss]="isBossEnemy()">
            @if (isBossEnemy()) {
              <span class="boss-badge">💀 BOSS</span>
            }
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
                @if (ability.isAoe) { <span class="aoe-tag">AoE</span> }
                @if (ability.currentCooldown > 0) {
                  <span class="cooldown">({{ ability.currentCooldown }})</span>
                }
              </button>
            }

            <button class="action-btn flee" (click)="flee()">
              🏃 Flee
            </button>

            @if (getConsumables().length > 0 || getBodyParts().length > 0) {
              <div class="consumables-row">
                <span class="consumables-label">🎒 Items:</span>
                @for (item of getConsumables(); track item.id) {
                  <button
                    class="action-btn consumable"
                    (click)="useConsumable(item)"
                    [title]="item.name + ': restores ' + item.healAmount + ' HP'"
                  >
                    🧪 {{ item.name }} (+{{ item.healAmount }} HP)
                  </button>
                }
                @for (bp of getBodyParts(); track bp.id) {
                  <button
                    class="action-btn body-part-btn"
                    [class.used]="traitConsumedThisCombat()"
                    [disabled]="traitConsumedThisCombat()"
                    (click)="useBodyPart(bp)"
                    [title]="bp.timesConsumed > 0 ? bp.description : 'Unbekannt – Effekte unbekannt'"
                  >
                    🧬 {{ bp.name }}
                    @if (bp.timesConsumed === 0) { <span class="blind-tag">?</span> }
                    @if (traitConsumedThisCombat()) { <span class="cooldown">(1/Kampf)</span> }
                  </button>
                }
              </div>
            }
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
    .combat-container{background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;padding:1.5rem;min-height:400px}
    .combat-start{display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;text-align:center}
    .combat-start h2{color:#ffd700;font-size:2rem;margin-bottom:1rem}
    .combat-start p{color:#a0a0a0;margin-bottom:2rem}
    .fight-btn{padding:1rem 3rem;font-size:1.2rem;font-weight:bold;border:none;border-radius:8px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;cursor:pointer;transition:all .3s}
    .fight-btn:hover:not(:disabled){transform:scale(1.05)}
    .fight-btn:disabled{background:#4a4a6a;cursor:not-allowed}
    .combat-arena{display:flex;flex-direction:column;gap:1.5rem}
    .combatant{padding:1rem;border-radius:8px;background:#2a2a4a}
    .combatant.enemy{border-left:4px solid #e74c3c}
    .combatant.enemy.boss{border-left-color:#9b59b6}
    .boss-badge,.boss-kill-banner{background:linear-gradient(135deg,#9b59b6,#8e44ad);color:white;font-weight:bold}
    .boss-badge{display:inline-block;padding:.2rem .6rem;border-radius:4px;font-size:.75rem}
    .boss-kill-banner{padding:.5rem 1rem;border-radius:8px;font-size:1.1rem;margin-bottom:.75rem}
    .combatant.player{border-left:4px solid #3498db}
    .combatant h3{margin:0 0 .25rem;color:#fff}
    .combatant .level{color:#ffd700;font-size:.85rem}
    .health-bar,.mana-bar{height:24px;background:#1a1a2e;border-radius:12px;margin-top:.5rem;position:relative;overflow:hidden}
    .health-fill{height:100%;background:linear-gradient(90deg,#e74c3c,#c0392b);transition:width .3s}
    .mana-fill{height:100%;background:linear-gradient(90deg,#3498db,#2980b9);transition:width .3s}
    .health-text,.mana-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:.75rem;font-weight:bold}
    .vs-indicator{text-align:center;font-size:1.5rem;font-weight:bold;color:#ffd700}
    .actions{display:flex;flex-wrap:wrap;gap:.5rem;padding:1rem;background:#2a2a4a;border-radius:8px}
    .actions.disabled{opacity:.6;pointer-events:none}
    .action-btn{padding:.75rem 1.5rem;border:none;border-radius:6px;font-weight:bold;cursor:pointer;transition:all .2s}
    .action-btn.attack{background:linear-gradient(135deg,#e74c3c,#c0392b);color:white}
    .action-btn.ability{background:linear-gradient(135deg,#9b59b6,#8e44ad);color:white}
    .action-btn.ability.on-cooldown,.action-btn:disabled{background:#4a4a6a;cursor:not-allowed;opacity:.8}
    .action-btn.flee{background:linear-gradient(135deg,#f39c12,#d68910);color:white}
    .action-btn:hover:not(:disabled){transform:translateY(-2px)}
    .cooldown{margin-left:.25rem;opacity:.7}
    .aoe-tag{margin-left:.3rem;background:rgba(255,255,255,.2);padding:.1rem .3rem;border-radius:3px;font-size:.7rem}
    .consumables-row{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;width:100%;margin-top:.25rem;padding-top:.5rem;border-top:1px solid #3a3a5a}
    .consumables-label{color:#a0a0a0;font-size:.85rem}
    .action-btn.consumable,.action-btn.body-part-btn{font-size:.85rem;padding:.5rem 1rem;color:white}
    .action-btn.consumable{background:linear-gradient(135deg,#27ae60,#1e8449)}
    .action-btn.body-part-btn{background:linear-gradient(135deg,#16a085,#1abc9c)}
    .action-btn.body-part-btn.used{background:#4a4a6a;opacity:.7}
    .blind-tag{margin-left:.3rem;border:1px solid #f39c12;padding:.1rem .35rem;border-radius:3px;font-size:.75rem;color:#f39c12}
    .combat-log{background:#1a1a2e;border-radius:8px;padding:1rem}
    .combat-log h4{margin:0 0 .5rem;color:#ffd700;font-size:.9rem}
    .log-entries{max-height:150px;overflow-y:auto}
    .log-entry{padding:.25rem 0;color:#a0a0a0;font-size:.85rem;border-bottom:1px solid #2a2a4a}
    .log-entry:last-child{border-bottom:none;color:#fff}
    .result-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:1000}
    .result-modal{background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;padding:2rem;max-width:460px;width:90%;text-align:center}
    .result-modal.victory{border:2px solid #ffd700}
    .result-modal.defeat{border:2px solid #e74c3c}
    .result-modal h2{color:#ffd700;margin:0 0 1rem;font-size:1.8rem}
    .result-modal.defeat h2{color:#e74c3c}
    .reward-row.quest-item{background:rgba(155,89,182,.15);border-radius:4px;padding:.35rem .5rem}
    .reward-row.body-part{background:rgba(39,174,96,.15);border-radius:4px;padding:.35rem .5rem}
    .rewards-summary{background:#2a2a4a;border-radius:10px;padding:1rem;margin-bottom:1rem;text-align:left}
    .reward-row{display:flex;justify-content:space-between;padding:.35rem 0;color:#a0a0a0}
    .reward-val{color:#ffd700;font-weight:bold}
    .level-up-section{background:linear-gradient(135deg,#2d1b69,#1b3a4b);border:2px solid #ffd700;border-radius:12px;padding:1rem;margin-bottom:1rem}
    .level-up-header{font-size:1.4rem;font-weight:bold;color:#ffd700;margin-bottom:.5rem}
    .level-up-badge{font-size:1.2rem;color:#fff;margin-bottom:.75rem}
    .stat-changes{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
    .stat-change{display:flex;justify-content:space-between;padding:.3rem .5rem;background:rgba(0,0,0,.3);border-radius:6px;font-size:.85rem;color:#e0e0e0}
    .stat-change .gain{color:#27ae60;font-weight:bold}
    .defeat-text,.skill-prompt{color:#a0a0a0;margin-bottom:1rem}
    .dismiss-btn{width:100%;padding:.85rem;border:none;border-radius:8px;background:linear-gradient(135deg,#ffd700,#ff8c00);color:#1a1a2e;font-size:1.1rem;font-weight:bold;cursor:pointer}
    .skill-selection,.skill-learned{text-align:center}
    .skill-selection h2{color:#ffd700;margin:0 0 .5rem}
    .skill-choices{display:flex;flex-direction:column;gap:.75rem;margin-bottom:1rem}
    .skill-choice-btn{display:flex;flex-direction:column;align-items:flex-start;padding:.85rem 1rem;border:2px solid #3a3a5a;border-radius:10px;background:#2a2a4a;color:#e0e0e0;cursor:pointer;transition:border-color .2s;text-align:left}
    .skill-choice-btn:hover{border-color:#ffd700;background:#333360}
    .skill-choice-btn.passive{border-color:#27ae60}
    .skill-icon{font-size:1.4rem}
    .skill-name{font-size:1rem;font-weight:bold;color:#ffd700}
    .skill-tag{font-size:.75rem;color:#a0a0a0}
    .skill-desc{font-size:.85rem;color:#c0c0c0}
    .skill-learned h2{color:#27ae60;margin:0 0 1rem}
    .learned-name{font-size:1.3rem;color:#ffd700;font-weight:bold;margin-bottom:1.5rem}
  `]
})
export class CombatComponent {
  private combatService = inject(CombatService);
  private characterService = inject(CharacterService);

  combatState = this.combatService.combatState;
  lastCombatResult = this.combatService.lastCombatResult;
  isBossEnemy = this.combatService.currentEnemyIsBoss;
  traitConsumedThisCombat = this.combatService.traitConsumedThisCombat;

  /** Set to true after choosing a skill (shows "Skill learned!" screen) */
  skillChosen = false;
  skillLearnedName = '';

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
  }

  useAbility(ability: Ability): void {
    this.combatService.useAbility(ability);
  }

  flee(): void {
    this.combatService.flee();
  }

  dismissResult(): void {
    this.skillChosen = false;
    this.skillLearnedName = '';
    this.combatService.dismissCombatResult();
  }

  selectSkill(skill: SkillDefinition, result: ReturnType<typeof this.lastCombatResult>): void {
    const character = this.characterService.activeCharacter();
    if (!character) return;
    this.characterService.learnSkill(character.id, skill);
    this.skillChosen = true;
    this.skillLearnedName = skill.name;
  }

  getUsableAbilities(): Ability[] {
    return this.combatState().player?.abilities.filter(a => a.id !== 'basic-attack' && !a.isPassive) || [];
  }

  getConsumables(): Consumable[] {
    const items = this.combatState().player?.inventory.items || [];
    return items.filter((i): i is Consumable => i.type === ItemType.CONSUMABLE && (i as Consumable).healAmount != null);
  }

  getBodyParts(): BodyPartItem[] {
    const items = this.combatState().player?.inventory.items || [];
    return items.filter((i): i is BodyPartItem => i.type === ItemType.BODY_PART);
  }

  useConsumable(item: Consumable): void {
    this.combatService.useConsumable(item);
  }

  useBodyPart(item: BodyPartItem): void {
    this.combatService.useBodyPart(item);
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
