import { Injectable, signal } from '@angular/core';
import {
  Quest,
  QuestStatus,
  QuestDifficulty,
  QuestObjective,
  ObjectiveType,
  getDifficultyMultiplier
} from '../models/quest.model';
import { CharacterService } from './character.service';

@Injectable({
  providedIn: 'root'
})
export class QuestService {
  private _availableQuests = signal<Quest[]>([]);
  private _activeQuest = signal<Quest | null>(null);
  private _completedQuests = signal<Quest[]>([]);
  private _pendingCompletion = signal<Quest | null>(null);
  private _currentLocation = signal<string>('Town');
  private _exploringLocation = signal<string | null>(null);

  availableQuests = this._availableQuests.asReadonly();
  activeQuest = this._activeQuest.asReadonly();
  completedQuests = this._completedQuests.asReadonly();
  pendingCompletion = this._pendingCompletion.asReadonly();
  currentLocation = this._currentLocation.asReadonly();
  exploringLocation = this._exploringLocation.asReadonly();

  constructor(private characterService: CharacterService) {
    this.generateInitialQuests();
  }

  /**
   * Generate initial quests
   */
  private generateInitialQuests(): void {
    const quests: Quest[] = [
      this.createQuest('Goblin Menace', 'Defeat the goblins terrorizing the village', QuestDifficulty.EASY, 1, [
        { id: '1', type: ObjectiveType.DEFEAT_ENEMIES, description: 'Defeat 3 goblins', targetCount: 3, currentCount: 0, completed: false, targetEnemyType: 'Goblin' }
      ], 'Village Outskirts'),
      this.createQuest('Dark Forest', 'Explore the mysterious dark forest', QuestDifficulty.MEDIUM, 3, [
        { id: '1', type: ObjectiveType.EXPLORE_LOCATION, description: 'Explore the forest', targetCount: 1, currentCount: 0, completed: false },
        { id: '2', type: ObjectiveType.DEFEAT_ENEMIES, description: 'Defeat forest creatures', targetCount: 5, currentCount: 0, completed: false }
      ], 'Dark Forest'),
      this.createQuest('The Ancient Ruins', 'Investigate the ancient ruins', QuestDifficulty.HARD, 5, [
        { id: '1', type: ObjectiveType.EXPLORE_LOCATION, description: 'Find the ruins entrance', targetCount: 1, currentCount: 0, completed: false },
        { id: '2', type: ObjectiveType.COLLECT_ITEMS, description: 'Collect ancient artifacts', targetCount: 3, currentCount: 0, completed: false },
        { id: '3', type: ObjectiveType.BOSS_FIGHT, description: 'Defeat the Guardian', targetCount: 1, currentCount: 0, completed: false }
      ], 'Ancient Ruins'),
      this.createQuest('Dragon\'s Lair', 'Confront the legendary dragon', QuestDifficulty.LEGENDARY, 10, [
        { id: '1', type: ObjectiveType.EXPLORE_LOCATION, description: 'Find the dragon\'s lair', targetCount: 1, currentCount: 0, completed: false },
        { id: '2', type: ObjectiveType.BOSS_FIGHT, description: 'Defeat the Dragon', targetCount: 1, currentCount: 0, completed: false }
      ], 'Dragon\'s Lair')
    ];

    this._availableQuests.set(quests);
  }

  /**
   * Create a quest
   */
  private createQuest(
    name: string,
    description: string,
    difficulty: QuestDifficulty,
    levelRequired: number,
    objectives: QuestObjective[],
    location?: string
  ): Quest {
    const multiplier = getDifficultyMultiplier(difficulty);
    
    return {
      id: crypto.randomUUID(),
      name,
      description,
      difficulty,
      status: QuestStatus.AVAILABLE,
      objectives,
      rewards: {
        experience: Math.floor(100 * multiplier * levelRequired),
        gold: Math.floor(50 * multiplier * levelRequired)
      },
      levelRequired,
      location
    };
  }

  /**
   * Start a quest
   */
  startQuest(questId: string, characterId: string): boolean {
    const quest = this._availableQuests().find(q => q.id === questId);
    const character = this.characterService.characters().find(c => c.id === characterId);

    if (!quest || !character) return false;
    if (character.level < quest.levelRequired) return false;
    if (this._activeQuest()) return false; // Already on a quest

    const activeQuest = { ...quest, status: QuestStatus.IN_PROGRESS };
    this._activeQuest.set(activeQuest);

    if (quest.location) {
      this._currentLocation.set(quest.location);
    }

    this._availableQuests.update(quests =>
      quests.filter(q => q.id !== questId)
    );

    return true;
  }

  /**
   * Update quest objective progress
   */
  updateObjective(objectiveId: string, progress: number = 1): void {
    const quest = this._activeQuest();
    if (!quest) return;

    const updatedObjectives = quest.objectives.map(obj => {
      if (obj.id !== objectiveId) return obj;
      
      const newCount = Math.min(obj.targetCount, obj.currentCount + progress);
      return {
        ...obj,
        currentCount: newCount,
        completed: newCount >= obj.targetCount
      };
    });

    this._activeQuest.set({
      ...quest,
      objectives: updatedObjectives
    });

    // Check if all objectives are complete
    if (updatedObjectives.every(obj => obj.completed)) {
      this.completeQuest();
    }
  }

  /**
   * Complete the active quest — move it to pending completion so the player can claim rewards
   */
  private completeQuest(): void {
    const quest = this._activeQuest();
    if (!quest) return;

    const completedQuest = { ...quest, status: QuestStatus.COMPLETED };
    this._activeQuest.set(null);
    this._pendingCompletion.set(completedQuest);
  }

  /**
   * Claim the rewards for the pending completed quest
   */
  claimRewards(): void {
    const quest = this._pendingCompletion();
    const character = this.characterService.activeCharacter();

    if (!quest || !character) return;

    // Award rewards
    this.characterService.addExperience(character.id, quest.rewards.experience);
    this.characterService.addGold(character.id, quest.rewards.gold);
    this.characterService.incrementQuestsCompleted(character.id);

    // Add reward items if any
    if (quest.rewards.items) {
      for (const item of quest.rewards.items) {
        this.characterService.addItemToInventory(character.id, item);
      }
    }

    this._completedQuests.update(quests => [quest, ...quests]);
    this._pendingCompletion.set(null);
    this._currentLocation.set('Town');

    // Generate new quests
    this.generateNewQuest(character.level);
  }

  /**
   * Abandon the current quest
   */
  abandonQuest(): void {
    const quest = this._activeQuest();
    if (!quest) return;

    // Reset objectives and add back to available
    const resetQuest: Quest = {
      ...quest,
      status: QuestStatus.AVAILABLE,
      objectives: quest.objectives.map(obj => ({
        ...obj,
        currentCount: 0,
        completed: false
      }))
    };

    this._availableQuests.update(quests => [...quests, resetQuest]);
    this._activeQuest.set(null);
    this._currentLocation.set('Town');
  }

  /**
   * Generate a new quest based on player level
   */
  private generateNewQuest(playerLevel: number): void {
    const questTemplates = [
      { name: 'Bandit Camp', description: 'Clear out the bandit camp', type: ObjectiveType.DEFEAT_ENEMIES, count: 4, location: 'Bandit Camp' },
      { name: 'Lost Treasure', description: 'Find the hidden treasure', type: ObjectiveType.COLLECT_ITEMS, count: 2, location: 'Treasure Cove' },
      { name: 'Monster Hunt', description: 'Hunt dangerous monsters', type: ObjectiveType.DEFEAT_ENEMIES, count: 6, location: 'Wilderness' },
      { name: 'Mysterious Cave', description: 'Explore the cave system', type: ObjectiveType.EXPLORE_LOCATION, count: 1, location: 'Mysterious Cave' }
    ];

    const template = questTemplates[Math.floor(Math.random() * questTemplates.length)];
    const difficulties = [QuestDifficulty.EASY, QuestDifficulty.MEDIUM, QuestDifficulty.HARD];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const levelReq = Math.max(1, playerLevel - 2 + Math.floor(Math.random() * 5));

    const newQuest = this.createQuest(
      template.name,
      template.description,
      difficulty,
      levelReq,
      [{ id: '1', type: template.type, description: template.description, targetCount: template.count, currentCount: 0, completed: false }],
      template.location
    );

    this._availableQuests.update(quests => [...quests, newQuest]);
  }

  /**
   * Start explore minigame for the current quest's explore objective
   */
  startExplore(): void {
    const quest = this._activeQuest();
    if (!quest) return;

    const exploreObjective = quest.objectives.find(
      obj => obj.type === ObjectiveType.EXPLORE_LOCATION && !obj.completed
    );
    if (!exploreObjective) return;

    this._exploringLocation.set(quest.location ?? quest.name);
  }

  /**
   * Complete the explore minigame — progress the explore objective
   */
  completeExplore(): void {
    this._exploringLocation.set(null);
    this.explore();
  }

  /**
   * Cancel the explore minigame
   */
  cancelExplore(): void {
    this._exploringLocation.set(null);
  }

  /**
   * Simulate exploration progress
   */
  explore(): void {
    const quest = this._activeQuest();
    if (!quest) return;

    // Find explore objectives and progress them
    const exploreObjective = quest.objectives.find(
      obj => obj.type === ObjectiveType.EXPLORE_LOCATION && !obj.completed
    );

    if (exploreObjective) {
      this.updateObjective(exploreObjective.id, 1);
    }
  }

  /**
   * Record enemy defeat for quest progress
   */
  recordEnemyDefeat(enemyName?: string): void {
    const quest = this._activeQuest();
    if (!quest) return;

    const defeatObjective = quest.objectives.find(
      obj =>
        obj.type === ObjectiveType.DEFEAT_ENEMIES &&
        !obj.completed &&
        (!obj.targetEnemyType ||
          (enemyName && obj.targetEnemyType.toLowerCase() === enemyName.toLowerCase()))
    );

    if (defeatObjective) {
      this.updateObjective(defeatObjective.id, 1);
    }
  }

  /**
   * Get serializable state for save game
   */
  getState(): {
    availableQuests: Quest[];
    activeQuest: Quest | null;
    completedQuests: Quest[];
    currentLocation: string;
  } {
    return {
      availableQuests: this._availableQuests(),
      activeQuest: this._activeQuest(),
      completedQuests: this._completedQuests(),
      currentLocation: this._currentLocation()
    };
  }

  /**
   * Load state from save game
   */
  loadState(state: {
    availableQuests: Quest[];
    activeQuest: Quest | null;
    completedQuests: Quest[];
    currentLocation: string;
  }): void {
    this._availableQuests.set(state.availableQuests);
    this._activeQuest.set(state.activeQuest);
    this._completedQuests.set(state.completedQuests);
    this._currentLocation.set(state.currentLocation);
  }
}
