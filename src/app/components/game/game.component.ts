import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService } from '../../services/character.service';
import { CombatService } from '../../services/combat.service';
import { SaveGameService } from '../../services/save-game.service';
import { CharacterCreationComponent } from '../character-creation/character-creation.component';
import { CharacterStatsComponent } from '../character-stats/character-stats.component';
import { CombatComponent } from '../combat/combat.component';
import { QuestComponent } from '../quest/quest.component';
import { InventoryComponent } from '../inventory/inventory.component';

type GameTab = 'combat' | 'quests' | 'inventory';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    CharacterCreationComponent,
    CharacterStatsComponent,
    CombatComponent,
    QuestComponent,
    InventoryComponent
  ],
  template: `
    <div class="game-container">
      <header class="game-header">
        <h1>⚔️ Epic Adventure ⚔️</h1>
        <p class="tagline">Fight. Explore. Become Legend.</p>
        @if (hasCharacter()) {
          <div class="save-controls">
            <button class="save-btn" (click)="saveGame()" title="Save Game">
              💾 Save
            </button>
            @if (saveMessage) {
              <span class="save-msg" [class.error]="saveError">{{ saveMessage }}</span>
            }
          </div>
        }
      </header>

      @if (!hasCharacter()) {
        <app-character-creation></app-character-creation>
      } @else {
        <div class="game-layout">
          <!-- Left Sidebar: Character Stats -->
          <aside class="sidebar">
            <app-character-stats [character]="activeCharacter()"></app-character-stats>
          </aside>

          <!-- Main Content -->
          <main class="main-content">
            <!-- Tab Navigation -->
            <nav class="tab-nav">
              <button
                class="tab-btn"
                [class.active]="activeTab === 'combat'"
                (click)="setTab('combat')"
              >
                ⚔️ Combat
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab === 'quests'"
                (click)="setTab('quests')"
              >
                📜 Quests
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab === 'inventory'"
                (click)="setTab('inventory')"
              >
                🎒 Inventory
              </button>
            </nav>

            <!-- Tab Content -->
            <div class="tab-content">
              @switch (activeTab) {
                @case ('combat') {
                  <app-combat></app-combat>
                }
                @case ('quests') {
                  <app-quest></app-quest>
                }
                @case ('inventory') {
                  <app-inventory></app-inventory>
                }
              }
            </div>
          </main>
        </div>
      }

      <footer class="game-footer">
        <p>© 2024 Epic Adventure - A Fighting & Exploration RPG</p>
      </footer>
    </div>
  `,
  styles: [`
    .game-container {
      min-height: 100vh;
      background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%);
      color: #e0e0e0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .game-header {
      text-align: center;
      padding: 2rem 1rem;
      background: linear-gradient(180deg, rgba(26, 26, 46, 0.9) 0%, transparent 100%);
    }

    .game-header h1 {
      color: #ffd700;
      font-size: 2.5rem;
      margin: 0;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
    }

    .tagline {
      color: #a0a0a0;
      font-style: italic;
      margin: 0.5rem 0 0 0;
    }

    .save-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .save-btn {
      padding: 0.4rem 1.2rem;
      border: none;
      border-radius: 6px;
      background: #2a2a4a;
      color: #e0e0e0;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .save-btn:hover {
      background: #3a4a5a;
      color: #ffd700;
    }

    .save-msg {
      color: #27ae60;
      font-size: 0.8rem;
    }

    .save-msg.error {
      color: #e74c3c;
    }

    .game-layout {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .sidebar {
      position: sticky;
      top: 1.5rem;
      height: fit-content;
    }

    .main-content {
      min-height: 500px;
    }

    .tab-nav {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      background: #1a1a2e;
      padding: 0.5rem;
      border-radius: 12px;
    }

    .tab-btn {
      flex: 1;
      padding: 1rem;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: #a0a0a0;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
    }

    .tab-btn:hover {
      background: #2a2a4a;
      color: #e0e0e0;
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
      color: #1a1a2e;
    }

    .tab-content {
      min-height: 400px;
    }

    .game-footer {
      text-align: center;
      padding: 2rem;
      color: #6a6a8a;
      font-size: 0.85rem;
      border-top: 1px solid #2a2a4a;
      margin-top: 2rem;
    }

    @media (max-width: 900px) {
      .game-layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
      }
    }
  `]
})
export class GameComponent implements OnInit {
  private characterService = inject(CharacterService);
  private combatService = inject(CombatService);
  private saveGameService = inject(SaveGameService);

  activeTab: GameTab = 'combat';
  activeCharacter = this.characterService.activeCharacter;
  saveMessage = '';
  saveError = false;

  private _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  private autoSaveEffect = effect(() => {
    // Debounced auto-save when character state changes (after initial load)
    const char = this.characterService.activeCharacter();
    if (char && this._initialized) {
      if (this._autoSaveTimer) {
        clearTimeout(this._autoSaveTimer);
      }
      this._autoSaveTimer = setTimeout(() => {
        this.saveGameService.saveGame();
      }, 1000);
    }
  });

  private _initialized = false;

  ngOnInit(): void {
    // Try to load saved game on startup
    if (this.saveGameService.hasSavedGame()) {
      this.saveGameService.loadGame();
    }
    this._initialized = true;
  }

  hasCharacter(): boolean {
    return this.characterService.characters().length > 0;
  }

  saveGame(): void {
    const success = this.saveGameService.saveGame();
    if (success) {
      this.saveMessage = '✅ Saved!';
      this.saveError = false;
    } else {
      this.saveMessage = '❌ Save failed';
      this.saveError = true;
    }
    setTimeout(() => { this.saveMessage = ''; }, 2000);
  }

  setTab(tab: GameTab): void {
    // Don't allow tab change during combat
    if (this.combatService.combatState().isActive && tab !== 'combat') {
      return;
    }
    this.activeTab = tab;
  }
}
