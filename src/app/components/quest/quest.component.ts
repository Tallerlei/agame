import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestService } from '../../services/quest.service';
import { CharacterService } from '../../services/character.service';
import { Quest, QuestDifficulty, QuestStatus } from '../../models/quest.model';

@Component({
  selector: 'app-quest',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quest-container">
      <h2>📜 Quests</h2>

      <!-- Active Quest -->
      @if (activeQuest()) {
        <div class="active-quest">
          <h3>Active Quest</h3>
          <div class="quest-card active">
            <div class="quest-header">
              <span class="quest-name">{{ activeQuest()!.name }}</span>
              <span class="difficulty" [class]="activeQuest()!.difficulty.toLowerCase()">
                {{ activeQuest()!.difficulty }}
              </span>
            </div>
            <p class="quest-desc">{{ activeQuest()!.description }}</p>
            
            <div class="objectives">
              <h4>Objectives:</h4>
              @for (obj of activeQuest()!.objectives; track obj.id) {
                <div class="objective" [class.completed]="obj.completed">
                  <span class="check">{{ obj.completed ? '✅' : '⬜' }}</span>
                  <span>{{ obj.description }}</span>
                  <span class="progress">({{ obj.currentCount }}/{{ obj.targetCount }})</span>
                </div>
              }
            </div>

            <div class="quest-rewards">
              <span>💰 {{ activeQuest()!.rewards.gold }} gold</span>
              <span>⭐ {{ activeQuest()!.rewards.experience }} XP</span>
            </div>

            <div class="quest-actions">
              <button class="explore-btn" (click)="explore()">
                🧭 Explore
              </button>
              <button class="abandon-btn" (click)="abandonQuest()">
                ❌ Abandon
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Available Quests -->
      <div class="available-quests">
        <h3>Available Quests</h3>
        @if (availableQuests().length === 0) {
          <p class="no-quests">No quests available. Complete your current quest!</p>
        } @else {
          <div class="quest-list">
            @for (quest of availableQuests(); track quest.id) {
              <div class="quest-card">
                <div class="quest-header">
                  <span class="quest-name">{{ quest.name }}</span>
                  <span class="difficulty" [class]="quest.difficulty.toLowerCase()">
                    {{ quest.difficulty }}
                  </span>
                </div>
                <p class="quest-desc">{{ quest.description }}</p>
                <div class="quest-meta">
                  <span class="level-req">Lv. {{ quest.levelRequired }}+</span>
                  <span class="rewards">
                    💰 {{ quest.rewards.gold }} | ⭐ {{ quest.rewards.experience }}
                  </span>
                </div>
                <button
                  class="accept-btn"
                  [disabled]="!canAcceptQuest(quest)"
                  (click)="acceptQuest(quest)"
                >
                  {{ canAcceptQuest(quest) ? 'Accept Quest' : 'Level Too Low' }}
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .quest-container {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 1.5rem;
    }

    h2 {
      color: #ffd700;
      margin: 0 0 1.5rem 0;
      text-align: center;
    }

    h3 {
      color: #e0e0e0;
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }

    .quest-card {
      background: #2a2a4a;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .quest-card.active {
      border: 2px solid #ffd700;
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
    }

    .quest-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .quest-name {
      color: #fff;
      font-weight: bold;
      font-size: 1.1rem;
    }

    .difficulty {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
    }

    .difficulty.easy {
      background: #27ae60;
      color: white;
    }

    .difficulty.medium {
      background: #f39c12;
      color: white;
    }

    .difficulty.hard {
      background: #e74c3c;
      color: white;
    }

    .difficulty.legendary {
      background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
      color: white;
    }

    .quest-desc {
      color: #a0a0a0;
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }

    .objectives {
      margin: 1rem 0;
      padding: 0.75rem;
      background: #1a1a2e;
      border-radius: 6px;
    }

    .objectives h4 {
      color: #e0e0e0;
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
    }

    .objective {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;
      color: #a0a0a0;
      font-size: 0.85rem;
    }

    .objective.completed {
      color: #27ae60;
      text-decoration: line-through;
    }

    .progress {
      margin-left: auto;
      color: #ffd700;
    }

    .quest-rewards {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
      color: #e0e0e0;
    }

    .quest-meta {
      display: flex;
      justify-content: space-between;
      margin: 0.5rem 0;
      color: #a0a0a0;
      font-size: 0.85rem;
    }

    .quest-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .explore-btn {
      flex: 1;
      padding: 0.75rem;
      border: none;
      border-radius: 6px;
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }

    .explore-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(52, 152, 219, 0.4);
    }

    .abandon-btn {
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 6px;
      background: #4a4a6a;
      color: #a0a0a0;
      cursor: pointer;
      transition: all 0.2s;
    }

    .abandon-btn:hover {
      background: #e74c3c;
      color: white;
    }

    .accept-btn {
      width: 100%;
      padding: 0.75rem;
      margin-top: 0.75rem;
      border: none;
      border-radius: 6px;
      background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
      color: white;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }

    .accept-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(39, 174, 96, 0.4);
    }

    .accept-btn:disabled {
      background: #4a4a6a;
      color: #8a8a8a;
      cursor: not-allowed;
    }

    .no-quests {
      text-align: center;
      color: #a0a0a0;
      padding: 2rem;
    }

    .quest-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `]
})
export class QuestComponent {
  private questService = inject(QuestService);
  private characterService = inject(CharacterService);

  availableQuests = this.questService.availableQuests;
  activeQuest = this.questService.activeQuest;

  canAcceptQuest(quest: Quest): boolean {
    const character = this.characterService.activeCharacter();
    if (!character) return false;
    if (this.activeQuest()) return false;
    return character.level >= quest.levelRequired;
  }

  acceptQuest(quest: Quest): void {
    const character = this.characterService.activeCharacter();
    if (character) {
      this.questService.startQuest(quest.id, character.id);
    }
  }

  abandonQuest(): void {
    this.questService.abandonQuest();
  }

  explore(): void {
    this.questService.explore();
  }
}
