import { Injectable, inject } from '@angular/core';
import { CharacterService } from './character.service';
import { QuestService } from './quest.service';

const SAVE_KEY = 'epic-adventure-save';

interface SaveData {
  version: number;
  timestamp: number;
  character: {
    characters: ReturnType<CharacterService['getState']>['characters'];
    activeCharacterId: string | null;
  };
  quest: ReturnType<QuestService['getState']>;
}

@Injectable({
  providedIn: 'root'
})
export class SaveGameService {
  private characterService = inject(CharacterService);
  private questService = inject(QuestService);

  /**
   * Save the current game state to localStorage
   */
  saveGame(): boolean {
    try {
      const saveData: SaveData = {
        version: 1,
        timestamp: Date.now(),
        character: this.characterService.getState(),
        quest: this.questService.getState()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load the game state from localStorage
   */
  loadGame(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;

      const saveData: SaveData = JSON.parse(raw);

      if (!saveData.version || !saveData.character || !saveData.quest) {
        return false;
      }

      this.characterService.loadState(
        saveData.character.characters,
        saveData.character.activeCharacterId
      );

      this.questService.loadState(saveData.quest);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a save game exists
   */
  hasSavedGame(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Delete the saved game
   */
  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  /**
   * Get the timestamp of the last save
   */
  getLastSaveTime(): Date | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const saveData: SaveData = JSON.parse(raw);
      return new Date(saveData.timestamp);
    } catch {
      return null;
    }
  }
}
