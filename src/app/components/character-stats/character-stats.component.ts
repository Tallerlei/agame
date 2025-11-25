import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character, CharacterClass } from '../../models/character.model';

@Component({
  selector: 'app-character-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (character) {
      <div class="character-stats">
        <div class="header">
          <span class="class-icon">{{ getClassIcon() }}</span>
          <div class="name-level">
            <h3>{{ character.name }}</h3>
            <span class="class-label">{{ character.characterClass }}</span>
          </div>
          <div class="level-badge">Lv. {{ character.level }}</div>
        </div>

        <div class="bars">
          <div class="bar-container">
            <label>HP</label>
            <div class="bar health-bar">
              <div
                class="bar-fill"
                [style.width.%]="(character.stats.currentHealth / character.stats.maxHealth) * 100"
              ></div>
              <span class="bar-text">
                {{ character.stats.currentHealth }} / {{ character.stats.maxHealth }}
              </span>
            </div>
          </div>

          <div class="bar-container">
            <label>MP</label>
            <div class="bar mana-bar">
              <div
                class="bar-fill"
                [style.width.%]="(character.stats.currentMana / character.stats.maxMana) * 100"
              ></div>
              <span class="bar-text">
                {{ character.stats.currentMana }} / {{ character.stats.maxMana }}
              </span>
            </div>
          </div>

          <div class="bar-container">
            <label>XP</label>
            <div class="bar exp-bar">
              <div
                class="bar-fill"
                [style.width.%]="(character.experience / character.experienceToNextLevel) * 100"
              ></div>
              <span class="bar-text">
                {{ character.experience }} / {{ character.experienceToNextLevel }}
              </span>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat">
            <span class="stat-label">STR</span>
            <span class="stat-value">{{ character.stats.strength }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">AGI</span>
            <span class="stat-value">{{ character.stats.agility }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">INT</span>
            <span class="stat-value">{{ character.stats.intelligence }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">ATK</span>
            <span class="stat-value">{{ character.stats.attackPower }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">DEF</span>
            <span class="stat-value">{{ character.stats.defense }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Gold</span>
            <span class="stat-value gold">{{ character.gold }}</span>
          </div>
        </div>

        <div class="achievements">
          <span>⚔️ Fights: {{ character.fightsWon }}</span>
          <span>📜 Quests: {{ character.questsCompleted }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .character-stats {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }

    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #4a4a6a;
    }

    .class-icon {
      font-size: 2.5rem;
    }

    .name-level {
      flex: 1;
    }

    h3 {
      margin: 0;
      color: #ffd700;
      font-size: 1.4rem;
    }

    .class-label {
      color: #a0a0a0;
      font-size: 0.9rem;
      text-transform: capitalize;
    }

    .level-badge {
      background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
      color: #1a1a2e;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: bold;
    }

    .bars {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .bar-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bar-container label {
      width: 30px;
      color: #a0a0a0;
      font-size: 0.85rem;
      font-weight: bold;
    }

    .bar {
      flex: 1;
      height: 24px;
      background: #2a2a4a;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }

    .bar-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .health-bar .bar-fill {
      background: linear-gradient(90deg, #e74c3c 0%, #c0392b 100%);
    }

    .mana-bar .bar-fill {
      background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
    }

    .exp-bar .bar-fill {
      background: linear-gradient(90deg, #9b59b6 0%, #8e44ad 100%);
    }

    .bar-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-size: 0.75rem;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem;
      background: #2a2a4a;
      border-radius: 8px;
    }

    .stat-label {
      color: #a0a0a0;
      font-size: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      color: #fff;
      font-size: 1.2rem;
      font-weight: bold;
    }

    .stat-value.gold {
      color: #ffd700;
    }

    .achievements {
      display: flex;
      justify-content: space-around;
      padding-top: 1rem;
      border-top: 1px solid #4a4a6a;
      color: #a0a0a0;
      font-size: 0.9rem;
    }
  `]
})
export class CharacterStatsComponent {
  @Input() character: Character | null = null;

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
}
