import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestService } from '../../services/quest.service';
import { CharacterService } from '../../services/character.service';
import { Quest, QuestDifficulty, QuestStatus, ObjectiveType } from '../../models/quest.model';
import { ExploreMinigameComponent } from '../explore-minigame/explore-minigame.component';
import { calculateEncumbrance } from '../../models/character.model';

@Component({
  selector: 'app-quest',
  standalone: true,
  imports: [CommonModule, ExploreMinigameComponent],
  template: `
    <div class="quest-container">
      <h2>📜 Quests</h2>

      <!-- Current Location -->
      <div class="current-location">
        📍 Current Location: <strong>{{ currentLocation() }}</strong>
      </div>

      <!-- Explore Minigame Overlay -->
      @if (exploringLocation(); as loc) {
        <div class="explore-overlay">
          <app-explore-minigame
            [locationName]="loc"
            [encumbranceLevel]="currentEncumbrance()"
            (completed)="onExploreComplete()"
            (cancel)="onExploreCancel()"
          ></app-explore-minigame>
        </div>
      }

      <!-- Quest Completion Modal -->
      @if (pendingCompletion()) {
        <div class="completion-overlay">
          <div class="completion-modal">
            <div class="completion-header">
              <span class="trophy">🏆</span>
              <h2>Quest Complete!</h2>
            </div>
            <h3>{{ pendingCompletion()!.name }}</h3>
            <p class="completion-desc">{{ pendingCompletion()!.description }}</p>

            <div class="rewards-section">
              <h4>Your Rewards:</h4>
              <div class="reward-items">
                <div class="reward-item">
                  <span class="reward-icon">💰</span>
                  <span class="reward-value">{{ pendingCompletion()!.rewards.gold }} Gold</span>
                </div>
                <div class="reward-item">
                  <span class="reward-icon">⭐</span>
                  <span class="reward-value">{{ pendingCompletion()!.rewards.experience }} XP</span>
                </div>
                @if (pendingCompletion()!.rewards.items && pendingCompletion()!.rewards.items!.length > 0) {
                  @for (item of pendingCompletion()!.rewards.items; track item.id) {
                    <div class="reward-item">
                      <span class="reward-icon">🎁</span>
                      <span class="reward-value">{{ item.name }}</span>
                    </div>
                  }
                }
              </div>
            </div>

            <button class="claim-btn" (click)="claimRewards()">
              ✅ Claim Rewards
            </button>
          </div>
        </div>
      }

      <!-- Active Quests -->
      @if (activeQuests().length > 0) {
        <div class="active-quest">
          <h3>Active Quest{{ activeQuests().length > 1 ? 's' : '' }}</h3>
          @for (quest of activeQuests(); track quest.id) {
          <div class="quest-card active">
            <div class="quest-header">
              <span class="quest-name">{{ quest.name }}</span>
              <span class="difficulty" [class]="quest.difficulty.toLowerCase()">
                {{ quest.difficulty }}
              </span>
            </div>
            <p class="quest-desc">{{ quest.description }}</p>
            
            <div class="objectives">
              <h4>Objectives:</h4>
              @for (obj of quest.objectives; track obj.id) {
                <div class="objective" [class.completed]="obj.completed">
                  <span class="check">{{ obj.completed ? '✅' : '⬜' }}</span>
                  <span>{{ obj.description }}</span>
                  <span class="progress">({{ obj.currentCount }}/{{ obj.targetCount }})</span>
                </div>
              }
            </div>

            @if (getProgressHint(quest); as hint) {
              <div class="quest-hint">{{ hint }}</div>
            }

            <div class="quest-rewards">
              <span>💰 {{ quest.rewards.gold }} gold</span>
              <span>⭐ {{ quest.rewards.experience }} XP</span>
            </div>

            <div class="quest-actions">
              <button
                class="explore-btn"
                [disabled]="!hasExploreObjective(quest)"
                [title]="hasExploreObjective(quest) ? 'Explore to progress location objective' : 'No exploration objective for this quest'"
                (click)="startExplore(quest.id)"
              >
                🧭 Explore
              </button>
              <button class="abandon-btn" (click)="abandonQuest(quest.id)">
                ❌ Abandon
              </button>
            </div>
          </div>
          }
        </div>
      }

      <!-- Available Quests -->
      <div class="available-quests">
        <h3>Available Quests</h3>
        @if (availableQuests().length === 0) {
          <p class="no-quests">No quests available. Check back after completing a quest!</p>
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

      <!-- Completed Quests -->
      @if (completedQuests().length > 0) {
        <div class="completed-quests">
          <h3>✅ Completed Quests ({{ completedQuests().length }})</h3>
          <div class="quest-list">
            @for (quest of completedQuests(); track quest.id) {
              <div class="quest-card completed">
                <div class="quest-header">
                  <span class="quest-name">{{ quest.name }}</span>
                  <span class="difficulty" [class]="quest.difficulty.toLowerCase()">
                    {{ quest.difficulty }}
                  </span>
                </div>
                <p class="quest-desc">{{ quest.description }}</p>
                <div class="quest-meta">
                  <span class="rewards">
                    💰 {{ quest.rewards.gold }} | ⭐ {{ quest.rewards.experience }}
                  </span>
                  <span class="completed-badge">✅ Done</span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .quest-container {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 1.5rem;
      position: relative;
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

    .quest-card.completed {
      opacity: 0.7;
      border-left: 4px solid #27ae60;
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

    .quest-hint {
      background: linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(142, 68, 173, 0.1));
      border: 1px solid rgba(155, 89, 182, 0.3);
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      margin: 0.5rem 0;
      color: #d4a5f5;
      font-size: 0.85rem;
      font-style: italic;
    }

    .quest-meta {
      display: flex;
      justify-content: space-between;
      margin: 0.5rem 0;
      color: #a0a0a0;
      font-size: 0.85rem;
    }

    .completed-badge {
      color: #27ae60;
      font-weight: bold;
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

    .explore-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(52, 152, 219, 0.4);
    }

    .explore-btn:disabled {
      background: #4a4a6a;
      color: #8a8a8a;
      cursor: not-allowed;
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

    /* Quest Completion Overlay */
    .completion-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .completion-modal {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #ffd700;
      border-radius: 16px;
      padding: 2rem;
      max-width: 420px;
      width: 90%;
      text-align: center;
      box-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
      animation: pop-in 0.3s ease-out;
    }

    @keyframes pop-in {
      from { transform: scale(0.8); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }

    .completion-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .completion-header h2 {
      margin: 0;
      font-size: 1.8rem;
    }

    .trophy {
      font-size: 2.5rem;
    }

    .completion-modal h3 {
      color: #ffd700;
      font-size: 1.3rem;
      margin: 0.5rem 0;
    }

    .completion-desc {
      color: #a0a0a0;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .rewards-section {
      background: #2a2a4a;
      border-radius: 10px;
      padding: 1rem 1.5rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }

    .rewards-section h4 {
      color: #e0e0e0;
      margin: 0 0 0.75rem 0;
      font-size: 0.95rem;
    }

    .reward-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .reward-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .reward-icon {
      font-size: 1.4rem;
    }

    .reward-value {
      color: #ffd700;
      font-size: 1.1rem;
      font-weight: bold;
    }

    .claim-btn {
      width: 100%;
      padding: 1rem;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
      color: white;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }

    .claim-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(39, 174, 96, 0.5);
    }

    .completed-quests {
      margin-top: 1.5rem;
    }

    .current-location {
      text-align: center;
      color: #a0a0a0;
      padding: 0.5rem;
      margin-bottom: 1rem;
      background: #2a2a4a;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .current-location strong {
      color: #ffd700;
    }

    .explore-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
  `]
})
export class QuestComponent {
  private questService = inject(QuestService);
  private characterService = inject(CharacterService);

  availableQuests = this.questService.availableQuests;
  activeQuests = this.questService.activeQuests;
  completedQuests = this.questService.completedQuests;
  pendingCompletion = this.questService.pendingCompletion;
  currentLocation = this.questService.currentLocation;
  exploringLocation = this.questService.exploringLocation;

  currentEncumbrance(): number {
    const char = this.characterService.activeCharacter();
    if (!char) return 0;
    return calculateEncumbrance(char.inventory.items.length, char.stats.strength);
  }

  canAcceptQuest(quest: Quest): boolean {
    const character = this.characterService.activeCharacter();
    if (!character) return false;
    if (this.activeQuests().some(q => q.id === quest.id)) return false;
    return character.level >= quest.levelRequired;
  }

  acceptQuest(quest: Quest): void {
    const character = this.characterService.activeCharacter();
    if (character) {
      this.questService.startQuest(quest.id, character.id);
    }
  }

  abandonQuest(questId: string): void {
    this.questService.abandonQuest(questId);
  }

  startExplore(questId: string): void {
    this.questService.startExplore(questId);
  }

  onExploreComplete(): void {
    this.questService.completeExplore();
  }

  onExploreCancel(): void {
    this.questService.cancelExplore();
  }

  claimRewards(): void {
    this.questService.claimRewards();
  }

  hasExploreObjective(quest: Quest): boolean {
    return quest.objectives.some(
      obj => obj.type === ObjectiveType.EXPLORE_LOCATION && !obj.completed
    );
  }

  getProgressHint(quest: Quest): string | null {
    return this.questService.getQuestProgressHint(quest);
  }
}
