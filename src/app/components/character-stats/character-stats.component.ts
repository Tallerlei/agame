import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character, CharacterClass } from '../../models/character.model';
import { AbilityType } from '../../models/ability.model';

type CharTab = 'stats' | 'skills' | 'traits';

@Component({
  selector: 'app-character-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (character) {
      <div class="character-stats">
        <div class="header">
          <span class="class-icon">{{ getClassIcon() }}{{ getSpriteModifiers() }}</span>
          <div class="name-level">
            <h3>{{ character.name }}</h3>
            <span class="class-label">{{ character.characterClass }}</span>
          </div>
          <div class="level-badge">Lv. {{ character.level }}</div>
        </div>

        <!-- Tab Navigation -->
        <div class="tab-nav">
          <button class="tab-btn" [class.active]="activeTab === 'stats'" (click)="activeTab = 'stats'">Stats</button>
          <button class="tab-btn" [class.active]="activeTab === 'skills'" (click)="activeTab = 'skills'">
            Skills <span class="tab-count">{{ getSkillCount() }}</span>
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'traits'" (click)="activeTab = 'traits'">
            Traits <span class="tab-count">{{ character.traits.length }}/5</span>
          </button>
        </div>

        <!-- Stats Tab -->
        @if (activeTab === 'stats') {
          <div class="bars">
            <div class="bar-container">
              <label>HP</label>
              <div class="bar health-bar">
                <div class="bar-fill" [style.width.%]="(character.stats.currentHealth / character.stats.maxHealth) * 100"></div>
                <span class="bar-text">{{ character.stats.currentHealth }} / {{ character.stats.maxHealth }}</span>
              </div>
            </div>
            <div class="bar-container">
              <label>MP</label>
              <div class="bar mana-bar">
                <div class="bar-fill" [style.width.%]="(character.stats.currentMana / character.stats.maxMana) * 100"></div>
                <span class="bar-text">{{ character.stats.currentMana }} / {{ character.stats.maxMana }}</span>
              </div>
            </div>
            <div class="bar-container">
              <label>XP</label>
              <div class="bar exp-bar">
                <div class="bar-fill" [style.width.%]="(character.experience / character.experienceToNextLevel) * 100"></div>
                <span class="bar-text">{{ character.experience }} / {{ character.experienceToNextLevel }}</span>
              </div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat"><span class="stat-label">STR</span><span class="stat-value">{{ character.stats.strength }}</span></div>
            <div class="stat"><span class="stat-label">AGI</span><span class="stat-value">{{ character.stats.agility }}</span></div>
            <div class="stat"><span class="stat-label">INT</span><span class="stat-value">{{ character.stats.intelligence }}</span></div>
            <div class="stat"><span class="stat-label">ATK</span><span class="stat-value">{{ character.stats.attackPower }}</span></div>
            <div class="stat"><span class="stat-label">DEF</span><span class="stat-value">{{ character.stats.defense }}</span></div>
            <div class="stat"><span class="stat-label">Gold</span><span class="stat-value gold">{{ character.gold }}</span></div>
          </div>

          <div class="achievements">
            <span>⚔️ Fights: {{ character.fightsWon }}</span>
            <span>📜 Quests: {{ character.questsCompleted }}</span>
          </div>
        }

        <!-- Skills Tab -->
        @if (activeTab === 'skills') {
          <div class="skills-panel">
            @if (getLearnedSkills().length === 0) {
              <p class="empty-msg">No skills learned yet.<br>Reach level 5 to choose your first skill!</p>
            }
            @for (skill of getLearnedSkills(); track skill.id) {
              <div class="skill-entry" [class.passive]="skill.isPassive">
                <div class="skill-header">
                  <span class="skill-icon">{{ skill.isPassive ? '🛡️' : skill.type === 'HEAL' ? '💚' : '💥' }}</span>
                  <span class="skill-name">{{ skill.name }}</span>
                  <span class="skill-badge">{{ skill.isPassive ? 'Passive' : 'Active' }}{{ skill.isAoe ? ' · AoE' : '' }}</span>
                </div>
                <p class="skill-desc">{{ skill.description }}</p>
                @if (!skill.isPassive) {
                  <div class="skill-stats">
                    @if (skill.damage) { <span>💥 {{ skill.damage }} DMG</span> }
                    @if (skill.healAmount) { <span>💚 {{ skill.healAmount }} Heal</span> }
                    <span>⏱ {{ skill.cooldown }}T CD</span>
                    <span>💧 {{ skill.manaCost }} MP</span>
                  </div>
                }
                @if (skill.isPassive && skill.passiveBonus) {
                  <div class="skill-stats">
                    @if (skill.passiveBonus.strength) { <span>💪 +{{ skill.passiveBonus.strength }} STR</span> }
                    @if (skill.passiveBonus.agility) { <span>🏃 +{{ skill.passiveBonus.agility }} AGI</span> }
                    @if (skill.passiveBonus.intelligence) { <span>🧠 +{{ skill.passiveBonus.intelligence }} INT</span> }
                    @if (skill.passiveBonus.defense) { <span>🛡 +{{ skill.passiveBonus.defense }} DEF</span> }
                    @if (skill.passiveBonus.attackPower) { <span>⚔️ +{{ skill.passiveBonus.attackPower }} ATK</span> }
                    @if (skill.passiveBonus.maxHealth) { <span>❤️ +{{ skill.passiveBonus.maxHealth }} MaxHP</span> }
                  </div>
                }
              </div>
            }
            <p class="next-skill-hint">
              @if (getNextSkillLevel() > 0) {
                Next skill choice: Level {{ getNextSkillLevel() }}
              }
            </p>
          </div>
        }

        <!-- Traits Tab -->
        @if (activeTab === 'traits') {
          <div class="traits-panel">
            <div class="trait-cap-bar">
              <span>Trait-Slots:</span>
              <div class="slot-indicators">
                @for (i of [0,1,2,3,4]; track i) {
                  <span class="slot" [class.filled]="i < character.traits.length"></span>
                }
              </div>
            </div>
            @if (character.traits.length === 0) {
              <p class="empty-msg">No traits yet.<br>Defeat enemies to find body parts!</p>
            }
            @for (trait of character.traits; track trait.definitionId) {
              <div class="trait-entry" [class.debuff-active]="trait.negativeDebuffActive">
                <div class="trait-header">
                  <span class="trait-name">{{ trait.name }}</span>
                  <span class="rarity-badge" [class]="'rarity-' + trait.rarity.toLowerCase()">{{ trait.rarity }}</span>
                  <span class="risk-badge" [class]="'risk-' + trait.riskLevel">{{ getRiskLabel(trait.riskLevel) }}</span>
                </div>
                <div class="trait-effects">
                  <div class="effect positive">
                    ✅ +{{ trait.positiveEffect.amount }} {{ trait.positiveEffect.stat }} <span class="perm-tag">(perm.)</span>
                  </div>
                  <div class="effect negative" [class.active]="trait.negativeDebuffActive">
                    ⚠️ {{ Math.round(trait.negativeEffect.chance * 100) }}% -{{ trait.negativeEffect.amount }} {{ trait.negativeEffect.stat }}
                    @if (trait.negativeEffect.durationFights > 0) {
                      ({{ trait.negativeEffect.durationFights }} fights)
                    }
                    @if (trait.negativeDebuffActive) {
                      <span class="debuff-counter">Active: {{ trait.negativeDebuffRemainingFights }}🕐</span>
                    }
                  </div>
                </div>
                <div class="trait-footer">
                  <span>Consumed: {{ trait.consumeCount }}×</span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .character-stats { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    .header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #4a4a6a; }
    .class-icon { font-size: 2rem; }
    .name-level { flex: 1; }
    h3 { margin: 0; color: #ffd700; font-size: 1.4rem; }
    .class-label { color: #a0a0a0; font-size: 0.9rem; text-transform: capitalize; }
    .level-badge { background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%); color: #1a1a2e; padding: 0.5rem 1rem; border-radius: 20px; font-weight: bold; white-space: nowrap; }
    .tab-nav { display: flex; gap: 0.35rem; margin-bottom: 1rem; background: #111130; padding: 0.35rem; border-radius: 8px; }
    .tab-btn { flex: 1; padding: 0.5rem; border: none; border-radius: 6px; background: transparent; color: #a0a0a0; font-size: 0.85rem; font-weight: bold; cursor: pointer; transition: all 0.2s; }
    .tab-btn:hover { background: #2a2a4a; color: #e0e0e0; }
    .tab-btn.active { background: linear-gradient(135deg, #ffd700, #ff8c00); color: #1a1a2e; }
    .tab-count { display: inline-block; margin-left: 0.25rem; background: rgba(0,0,0,0.25); border-radius: 8px; padding: 0 0.3rem; font-size: 0.75rem; }
    .bars { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
    .bar-container { display: flex; align-items: center; gap: 0.5rem; }
    .bar-container label { width: 30px; color: #a0a0a0; font-size: 0.85rem; font-weight: bold; }
    .bar { flex: 1; height: 24px; background: #2a2a4a; border-radius: 12px; overflow: hidden; position: relative; }
    .bar-fill { height: 100%; transition: width 0.3s ease; }
    .health-bar .bar-fill { background: linear-gradient(90deg, #e74c3c, #c0392b); }
    .mana-bar .bar-fill { background: linear-gradient(90deg, #3498db, #2980b9); }
    .exp-bar .bar-fill { background: linear-gradient(90deg, #9b59b6, #8e44ad); }
    .bar-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: #fff; font-size: 0.75rem; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
    .stat { display: flex; flex-direction: column; align-items: center; padding: 0.75rem; background: #2a2a4a; border-radius: 8px; }
    .stat-label { color: #a0a0a0; font-size: 0.75rem; margin-bottom: 0.25rem; }
    .stat-value { color: #fff; font-size: 1.2rem; font-weight: bold; }
    .stat-value.gold { color: #ffd700; }
    .achievements { display: flex; justify-content: space-around; padding-top: 1rem; border-top: 1px solid #4a4a6a; color: #a0a0a0; font-size: 0.9rem; }
    .empty-msg { color: #6a6a8a; font-size: 0.9rem; text-align: center; padding: 1rem 0; line-height: 1.5; }
    .skills-panel { display: flex; flex-direction: column; gap: 0.6rem; }
    .skill-entry { background: #2a2a4a; border-radius: 8px; padding: 0.75rem; border-left: 3px solid #9b59b6; }
    .skill-entry.passive { border-left-color: #27ae60; }
    .skill-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
    .skill-icon { font-size: 1.1rem; }
    .skill-name { font-weight: bold; color: #ffd700; flex: 1; }
    .skill-badge { font-size: 0.7rem; background: rgba(155,89,182,0.3); color: #d2a8ff; padding: 0.15rem 0.4rem; border-radius: 4px; white-space: nowrap; }
    .skill-entry.passive .skill-badge { background: rgba(39,174,96,0.3); color: #7ddb7d; }
    .skill-desc { font-size: 0.82rem; color: #c0c0c0; margin: 0 0 0.4rem; }
    .skill-stats { display: flex; flex-wrap: wrap; gap: 0.4rem; font-size: 0.78rem; color: #a0c4ff; }
    .skill-stats span { background: rgba(0,0,0,0.3); padding: 0.1rem 0.4rem; border-radius: 4px; }
    .next-skill-hint { text-align: center; color: #6a6a8a; font-size: 0.8rem; margin-top: 0.5rem; }
    .traits-panel { display: flex; flex-direction: column; gap: 0.6rem; }
    .trait-cap-bar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; color: #a0a0a0; font-size: 0.85rem; }
    .slot-indicators { display: flex; gap: 0.3rem; }
    .slot { width: 18px; height: 18px; border-radius: 4px; background: #3a3a5a; border: 1px solid #5a5a7a; }
    .slot.filled { background: linear-gradient(135deg, #16a085, #1abc9c); border-color: #1abc9c; }
    .trait-entry { background: #2a2a4a; border-radius: 8px; padding: 0.75rem; border-left: 3px solid #16a085; }
    .trait-entry.debuff-active { border-left-color: #e74c3c; box-shadow: 0 0 8px rgba(231,76,60,0.2); }
    .trait-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap; }
    .trait-name { font-weight: bold; color: #ffd700; flex: 1; }
    .rarity-badge { font-size: 0.7rem; padding: 0.1rem 0.35rem; border-radius: 4px; font-weight: bold; }
    .rarity-common { background: rgba(160,160,160,0.2); color: #c0c0c0; }
    .rarity-uncommon { background: rgba(39,174,96,0.2); color: #7ddb7d; }
    .rarity-rare { background: rgba(52,152,219,0.2); color: #7dc4f8; }
    .rarity-epic { background: rgba(155,89,182,0.2); color: #d2a8ff; }
    .rarity-legendary { background: rgba(255,165,0,0.2); color: #ffd700; }
    .risk-badge { font-size: 0.7rem; padding: 0.1rem 0.35rem; border-radius: 4px; }
    .risk-low { background: rgba(39,174,96,0.2); color: #7ddb7d; }
    .risk-medium { background: rgba(243,156,18,0.2); color: #f8c87d; }
    .risk-high { background: rgba(231,76,60,0.2); color: #f87d7d; }
    .trait-effects { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.4rem; font-size: 0.82rem; }
    .effect { padding: 0.25rem 0.5rem; border-radius: 4px; }
    .effect.positive { background: rgba(39,174,96,0.1); color: #7ddb7d; }
    .effect.negative { background: rgba(160,160,160,0.08); color: #a0a0a0; }
    .effect.negative.active { background: rgba(231,76,60,0.15); color: #f87d7d; }
    .perm-tag { font-size: 0.72rem; color: #6a6a8a; }
    .debuff-counter { margin-left: 0.5rem; background: rgba(231,76,60,0.3); padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.75rem; }
    .trait-footer { font-size: 0.75rem; color: #6a6a8a; }
  `]
})
export class CharacterStatsComponent {
  @Input() character: Character | null = null;

  activeTab: CharTab = 'stats';
  readonly Math = Math;

  getClassIcon(): string {
    if (!this.character) return '';
    switch (this.character.characterClass) {
      case CharacterClass.WARRIOR: return '⚔️';
      case CharacterClass.MAGE: return '🔮';
      case CharacterClass.ROGUE: return '🗡️';
      case CharacterClass.HEALER: return '✨';
      default: return '👤';
    }
  }

  /** Returns visual modifiers from active traits (e.g. red-eyes sprite) */
  getSpriteModifiers(): string {
    if (!this.character) return '';
    const mods = this.character.traits
      .filter(t => t.spriteMod)
      .map(t => {
        switch (t.spriteMod) {
          case 'red-eyes': return '🔴';
          case 'green-tint': return '🟢';
          default: return '';
        }
      })
      .filter(Boolean);
    return mods.length > 0 ? mods.join('') : '';
  }

  getLearnedSkills() {
    return this.character?.abilities.filter(a => a.isSkill) ?? [];
  }

  getSkillCount(): number {
    return this.getLearnedSkills().length;
  }

  getNextSkillLevel(): number {
    if (!this.character) return 0;
    const currentLevel = this.character.level;
    const nextMilestone = Math.ceil((currentLevel + 1) / 5) * 5;
    return nextMilestone;
  }

  getRiskLabel(riskLevel: 'low' | 'medium' | 'high'): string {
    switch (riskLevel) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
    }
  }
}
