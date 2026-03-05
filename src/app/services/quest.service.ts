import { Injectable, signal, computed } from '@angular/core';
import {
  Quest,
  QuestStatus,
  QuestDifficulty,
  QuestObjective,
  ObjectiveType,
  getDifficultyMultiplier,
  getBossSpawnThreshold,
  getItemDropThreshold
} from '../models/quest.model';
import { CharacterService } from './character.service';

/** Template for a single objective in a generated quest */
interface QuestObjectiveTemplate {
  type: ObjectiveType;
  description: string;
  count: number;
  targetEnemyType?: string;
  targetBossName?: string;
  targetItemName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuestService {
  private _availableQuests = signal<Quest[]>([]);
  private _activeQuests = signal<Quest[]>([]);
  private _completedQuests = signal<Quest[]>([]);
  private _pendingCompletions = signal<Quest[]>([]);
  private _currentLocation = signal<string>('Town');
  private _exploringLocation = signal<string | null>(null);
  private _exploringQuestId = signal<string | null>(null);

  availableQuests = this._availableQuests.asReadonly();
  activeQuests = this._activeQuests.asReadonly();
  completedQuests = this._completedQuests.asReadonly();
  pendingCompletion = computed(() => this._pendingCompletions()[0] ?? null);
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
      ], 'Village Outskirts', ['Goblin']),
      this.createQuest('Dark Forest', 'Explore the mysterious dark forest', QuestDifficulty.MEDIUM, 3, [
        { id: '1', type: ObjectiveType.EXPLORE_LOCATION, description: 'Explore the forest', targetCount: 1, currentCount: 0, completed: false },
        { id: '2', type: ObjectiveType.DEFEAT_ENEMIES, description: 'Defeat forest creatures', targetCount: 5, currentCount: 0, completed: false }
      ], 'Dark Forest', ['Wolf', 'Skeleton', 'Troll']),
      this.createQuest('The Ancient Ruins', 'Investigate the ancient ruins', QuestDifficulty.HARD, 5, [
        { id: '1', type: ObjectiveType.EXPLORE_LOCATION, description: 'Find the ruins entrance', targetCount: 1, currentCount: 0, completed: false },
        { id: '2', type: ObjectiveType.COLLECT_ITEMS, description: 'Collect ancient artifacts', targetCount: 3, currentCount: 0, completed: false, targetItemName: 'Ancient Artifact' },
        { id: '3', type: ObjectiveType.BOSS_FIGHT, description: 'Defeat the Guardian', targetCount: 1, currentCount: 0, completed: false, targetBossName: 'Guardian' }
      ], 'Ancient Ruins', ['Skeleton', 'Bandit']),
      this.createQuest('Dragon\'s Lair', 'Confront the legendary dragon', QuestDifficulty.LEGENDARY, 10, [
        { id: '1', type: ObjectiveType.EXPLORE_LOCATION, description: 'Find the dragon\'s lair', targetCount: 1, currentCount: 0, completed: false },
        { id: '2', type: ObjectiveType.BOSS_FIGHT, description: 'Defeat the Dragon', targetCount: 1, currentCount: 0, completed: false, targetBossName: 'Dragon' }
      ], 'Dragon\'s Lair', ['Orc', 'Troll', 'Skeleton'])
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
    location?: string,
    questEnemies?: string[]
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
      location,
      questEnemies,
      combatCount: 0
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

    const activeQuest = { ...quest, status: QuestStatus.IN_PROGRESS, combatCount: 0 };
    this._activeQuests.update(quests => [...quests, activeQuest]);

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
    const quest = this._activeQuests().find(q =>
      q.objectives.some(obj => obj.id === objectiveId)
    );
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

    const updatedQuest = { ...quest, objectives: updatedObjectives };
    this._activeQuests.update(quests =>
      quests.map(q => q.id === quest.id ? updatedQuest : q)
    );

    // Check if all objectives are complete
    if (updatedObjectives.every(obj => obj.completed)) {
      this.completeQuestById(quest.id);
    }
  }

  /**
   * Complete the active quest — move it to pending completion so the player can claim rewards
   */
  private completeQuestById(questId: string): void {
    const quest = this._activeQuests().find(q => q.id === questId);
    if (!quest) return;

    const completedQuest = { ...quest, status: QuestStatus.COMPLETED };
    this._activeQuests.update(quests => quests.filter(q => q.id !== questId));
    this._pendingCompletions.update(pending => [...pending, completedQuest]);
  }

  /**
   * Claim the rewards for the pending completed quest
   */
  claimRewards(): void {
    const quest = this._pendingCompletions()[0];
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
    this._pendingCompletions.update(pending => pending.slice(1));

    // Reset location only if no more active quests
    if (this._activeQuests().length === 0) {
      this._currentLocation.set('Town');
    }

    // Generate new quests
    this.generateNewQuest(character.level);
  }

  /**
   * Abandon the current quest
   */
  abandonQuest(questId: string): void {
    const quest = this._activeQuests().find(q => q.id === questId);
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
    this._activeQuests.update(quests => quests.filter(q => q.id !== questId));

    // Reset location only if no more active quests
    if (this._activeQuests().length === 0) {
      this._currentLocation.set('Town');
    }
  }

  /**
   * Generate a new quest based on player level
   */
  private generateNewQuest(playerLevel: number): void {
    const questTemplates: { name: string; description: string; objectives: QuestObjectiveTemplate[]; location: string; questEnemies: string[] }[] = [
      {
        name: 'Bandit Camp',
        description: 'Clear out the bandit camp and find their treasure',
        objectives: [
          { type: ObjectiveType.DEFEAT_ENEMIES, description: 'Defeat bandits', count: 4, targetEnemyType: 'Bandit' },
          { type: ObjectiveType.COLLECT_ITEMS, description: 'Find stolen treasure', count: 2, targetItemName: 'Stolen Treasure' }
        ],
        location: 'Bandit Camp',
        questEnemies: ['Bandit']
      },
      {
        name: 'Lost Treasure',
        description: 'Find the hidden treasure in the cove',
        objectives: [
          { type: ObjectiveType.EXPLORE_LOCATION, description: 'Explore the cove', count: 1 },
          { type: ObjectiveType.COLLECT_ITEMS, description: 'Collect treasure chests', count: 3, targetItemName: 'Treasure Chest' }
        ],
        location: 'Treasure Cove',
        questEnemies: ['Skeleton', 'Bandit']
      },
      {
        name: 'Monster Hunt',
        description: 'Hunt dangerous monsters in the wilderness',
        objectives: [
          { type: ObjectiveType.DEFEAT_ENEMIES, description: 'Hunt dangerous monsters', count: 6 }
        ],
        location: 'Wilderness',
        questEnemies: ['Wolf', 'Orc', 'Troll']
      },
      {
        name: 'Mysterious Cave',
        description: 'Explore the cave and defeat the cave troll',
        objectives: [
          { type: ObjectiveType.EXPLORE_LOCATION, description: 'Explore the cave system', count: 1 },
          { type: ObjectiveType.DEFEAT_ENEMIES, description: 'Clear cave creatures', count: 3 },
          { type: ObjectiveType.BOSS_FIGHT, description: 'Defeat the Cave Troll', count: 1, targetBossName: 'Cave Troll' }
        ],
        location: 'Mysterious Cave',
        questEnemies: ['Skeleton', 'Goblin']
      }
    ];

    const template = questTemplates[Math.floor(Math.random() * questTemplates.length)];
    const difficulties = [QuestDifficulty.EASY, QuestDifficulty.MEDIUM, QuestDifficulty.HARD];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const levelReq = Math.max(1, playerLevel - 2 + Math.floor(Math.random() * 5));

    const objectives: QuestObjective[] = template.objectives.map((obj, index) => ({
      id: String(index + 1),
      type: obj.type,
      description: obj.description,
      targetCount: obj.count,
      currentCount: 0,
      completed: false,
      targetEnemyType: obj.targetEnemyType,
      targetBossName: obj.targetBossName,
      targetItemName: obj.targetItemName
    }));

    const newQuest = this.createQuest(
      template.name,
      template.description,
      difficulty,
      levelReq,
      objectives,
      template.location,
      template.questEnemies
    );

    this._availableQuests.update(quests => [...quests, newQuest]);
  }

  /**
   * Start explore minigame for the given quest's explore objective
   */
  startExplore(questId: string): void {
    const quest = this._activeQuests().find(q => q.id === questId);
    if (!quest) return;

    const exploreObjective = quest.objectives.find(
      obj => obj.type === ObjectiveType.EXPLORE_LOCATION && !obj.completed
    );
    if (!exploreObjective) return;

    this._exploringQuestId.set(questId);
    this._exploringLocation.set(quest.location ?? quest.name);
  }

  /**
   * Complete the explore minigame — progress the explore objective
   */
  completeExplore(): void {
    const questId = this._exploringQuestId();
    this._exploringLocation.set(null);
    this._exploringQuestId.set(null);
    if (questId) {
      this.exploreQuest(questId);
    }
  }

  /**
   * Cancel the explore minigame
   */
  cancelExplore(): void {
    this._exploringLocation.set(null);
    this._exploringQuestId.set(null);
  }

  /**
   * Progress the exploration objective for the given quest
   */
  private exploreQuest(questId: string): void {
    const quest = this._activeQuests().find(q => q.id === questId);
    if (!quest) return;

    const exploreObjective = quest.objectives.find(
      obj => obj.type === ObjectiveType.EXPLORE_LOCATION && !obj.completed
    );

    if (exploreObjective) {
      this.updateObjective(exploreObjective.id, 1);
    }
  }

  /**
   * Get a quest-context enemy name for combat.
   * If the player has active quests, bias enemy selection towards quest-relevant enemies.
   * Returns null if no quest context is active.
   */
  getQuestContextEnemy(characterLevel: number): { name: string; isBoss: boolean } | null {
    const quests = this._activeQuests();
    if (quests.length === 0) return null;

    for (const quest of quests) {
      const combatCount = quest.combatCount ?? 0;

      // Check for BOSS_FIGHT objectives
      const bossObjective = quest.objectives.find(
        obj => obj.type === ObjectiveType.BOSS_FIGHT && !obj.completed && obj.targetBossName
      );
      if (bossObjective) {
        // Check if all prior objectives (before the boss) are completed
        const bossIndex = quest.objectives.indexOf(bossObjective);
        const priorObjectivesComplete = quest.objectives
          .slice(0, bossIndex)
          .every(obj => obj.completed);

        if (priorObjectivesComplete) {
          const threshold = getBossSpawnThreshold(quest.difficulty);
          if (combatCount >= threshold) {
            // Progressive boss spawn chance: starts at 30%, increases by 15% per fight over threshold
            const extraFights = combatCount - threshold;
            const bossChance = Math.min(1.0, 0.3 + extraFights * 0.15);
            if (Math.random() < bossChance) {
              return { name: bossObjective.targetBossName!, isBoss: true };
            }
          }
        }
      }

      // Check for DEFEAT_ENEMIES objectives with specific enemy type
      const defeatObjective = quest.objectives.find(
        obj => obj.type === ObjectiveType.DEFEAT_ENEMIES && !obj.completed && obj.targetEnemyType
      );
      if (defeatObjective) {
        // 70% chance to spawn the quest-specific enemy type
        if (Math.random() < 0.7) {
          return { name: defeatObjective.targetEnemyType!, isBoss: false };
        }
      }

      // Use quest location enemies if available
      if (quest.questEnemies && quest.questEnemies.length > 0) {
        if (Math.random() < 0.6) {
          const enemy = quest.questEnemies[Math.floor(Math.random() * quest.questEnemies.length)];
          return { name: enemy, isBoss: false };
        }
      }
    }

    return null;
  }

  /**
   * Increment the combat counter for all active quests and return whether a quest item should drop.
   * Returns the item name to drop, or null if no quest item should drop.
   */
  incrementCombatCounter(): string | null {
    let itemToDrop: string | null = null;

    this._activeQuests.update(quests =>
      quests.map(quest => {
        const newCount = (quest.combatCount ?? 0) + 1;
        const updatedQuest = { ...quest, combatCount: newCount };

        // Check for COLLECT_ITEMS objectives that need item drops
        const collectObjective = quest.objectives.find(
          obj => obj.type === ObjectiveType.COLLECT_ITEMS && !obj.completed && obj.targetItemName
        );
        if (collectObjective && !itemToDrop) {
          const threshold = getItemDropThreshold(quest.difficulty);
          // Progressive drop chance: starts at 20% after threshold/2 fights, increases to guaranteed after threshold
          if (newCount >= threshold) {
            itemToDrop = collectObjective.targetItemName!;
          } else if (newCount >= Math.ceil(threshold / 2)) {
            const progress = (newCount - Math.ceil(threshold / 2)) / (threshold - Math.ceil(threshold / 2));
            const dropChance = 0.2 + progress * 0.3;
            if (Math.random() < dropChance) {
              itemToDrop = collectObjective.targetItemName!;
            }
          }
        }

        return updatedQuest;
      })
    );

    return itemToDrop;
  }

  /**
   * Record that a quest item was collected - progresses COLLECT_ITEMS objectives
   */
  recordItemCollected(itemName: string): void {
    for (const quest of this._activeQuests()) {
      const collectObjective = quest.objectives.find(
        obj =>
          obj.type === ObjectiveType.COLLECT_ITEMS &&
          !obj.completed &&
          obj.targetItemName &&
          obj.targetItemName.toLowerCase() === itemName.toLowerCase()
      );

      if (collectObjective) {
        this.updateObjective(collectObjective.id, 1);
      }
    }
  }

  /**
   * Record that a boss was defeated - progresses BOSS_FIGHT objectives
   */
  recordBossDefeat(bossName: string): void {
    for (const quest of this._activeQuests()) {
      const bossObjective = quest.objectives.find(
        obj =>
          obj.type === ObjectiveType.BOSS_FIGHT &&
          !obj.completed &&
          obj.targetBossName &&
          obj.targetBossName.toLowerCase() === bossName.toLowerCase()
      );

      if (bossObjective) {
        this.updateObjective(bossObjective.id, 1);
      }
    }
  }

  /**
   * Get quest progress hint for display (e.g., "Boss approaching...")
   */
  getQuestProgressHint(quest: Quest): string | null {
    const combatCount = quest.combatCount ?? 0;
    const bossObjective = quest.objectives.find(
      obj => obj.type === ObjectiveType.BOSS_FIGHT && !obj.completed && obj.targetBossName
    );
    if (bossObjective) {
      const threshold = getBossSpawnThreshold(quest.difficulty);
      const bossIndex = quest.objectives.indexOf(bossObjective);
      const priorComplete = quest.objectives.slice(0, bossIndex).every(obj => obj.completed);

      if (priorComplete) {
        if (combatCount >= threshold) {
          return `⚠️ ${bossObjective.targetBossName} is near! Keep fighting!`;
        } else if (combatCount >= Math.ceil(threshold * 0.6)) {
          return `🔥 You sense a powerful presence... (${combatCount}/${threshold} fights)`;
        }
      }
    }

    const collectObjective = quest.objectives.find(
      obj => obj.type === ObjectiveType.COLLECT_ITEMS && !obj.completed && obj.targetItemName
    );
    if (collectObjective) {
      return `🔍 Searching for ${collectObjective.targetItemName} (${collectObjective.currentCount}/${collectObjective.targetCount})`;
    }

    return null;
  }

  /**
   * Record enemy defeat for quest progress
   */
  recordEnemyDefeat(enemyName?: string): void {
    for (const quest of this._activeQuests()) {
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
  }

  /**
   * Get serializable state for save game
   */
  getState(): {
    availableQuests: Quest[];
    activeQuests: Quest[];
    completedQuests: Quest[];
    currentLocation: string;
  } {
    return {
      availableQuests: this._availableQuests(),
      activeQuests: this._activeQuests(),
      completedQuests: this._completedQuests(),
      currentLocation: this._currentLocation()
    };
  }

  /**
   * Load state from save game
   */
  loadState(state: {
    availableQuests: Quest[];
    activeQuest?: Quest | null;
    activeQuests?: Quest[];
    completedQuests: Quest[];
    currentLocation: string;
  }): void {
    this._availableQuests.set(state.availableQuests);
    if (state.activeQuests) {
      this._activeQuests.set(state.activeQuests);
    } else if (state.activeQuest) {
      this._activeQuests.set([state.activeQuest]);
    } else {
      this._activeQuests.set([]);
    }
    this._completedQuests.set(state.completedQuests);
    this._currentLocation.set(state.currentLocation);
  }
}
