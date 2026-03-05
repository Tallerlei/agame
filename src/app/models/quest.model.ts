import { Item } from './item.model';

/**
 * Quest difficulty levels
 */
export enum QuestDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  LEGENDARY = 'LEGENDARY'
}

/**
 * Quest status
 */
export enum QuestStatus {
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

/**
 * Quest objective types
 */
export enum ObjectiveType {
  DEFEAT_ENEMIES = 'DEFEAT_ENEMIES',
  COLLECT_ITEMS = 'COLLECT_ITEMS',
  EXPLORE_LOCATION = 'EXPLORE_LOCATION',
  BOSS_FIGHT = 'BOSS_FIGHT'
}

/**
 * Quest objective
 */
export interface QuestObjective {
  id: string;
  type: ObjectiveType;
  description: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  targetEnemyType?: string; // For DEFEAT_ENEMIES objectives: restricts which enemy types count
  targetBossName?: string;  // For BOSS_FIGHT objectives: the boss enemy name to spawn
  targetItemName?: string;  // For COLLECT_ITEMS objectives: the quest item name that should drop
}

/**
 * Quest rewards
 */
export interface QuestReward {
  experience: number;
  gold: number;
  items?: Item[];
}

/**
 * Exploration quest
 */
export interface Quest {
  id: string;
  name: string;
  description: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards: QuestReward;
  levelRequired: number;
  location?: string;
  questEnemies?: string[];  // Enemy types that appear in this quest's location
  combatCount?: number;     // Number of fights the player has had while on this quest
}

/**
 * Calculate reward multiplier based on difficulty
 */
export function getDifficultyMultiplier(difficulty: QuestDifficulty): number {
  switch (difficulty) {
    case QuestDifficulty.EASY:
      return 1;
    case QuestDifficulty.MEDIUM:
      return 1.5;
    case QuestDifficulty.HARD:
      return 2.5;
    case QuestDifficulty.LEGENDARY:
      return 5;
    default:
      return 1;
  }
}

/**
 * Get the minimum number of fights before a boss can spawn for this difficulty
 */
export function getBossSpawnThreshold(difficulty: QuestDifficulty): number {
  switch (difficulty) {
    case QuestDifficulty.EASY:
      return 3;
    case QuestDifficulty.MEDIUM:
      return 5;
    case QuestDifficulty.HARD:
      return 8;
    case QuestDifficulty.LEGENDARY:
      return 10;
    default:
      return 5;
  }
}

/**
 * Get the number of fights before a quest item is guaranteed to drop
 */
export function getItemDropThreshold(difficulty: QuestDifficulty): number {
  switch (difficulty) {
    case QuestDifficulty.EASY:
      return 3;
    case QuestDifficulty.MEDIUM:
      return 4;
    case QuestDifficulty.HARD:
      return 6;
    case QuestDifficulty.LEGENDARY:
      return 8;
    default:
      return 4;
  }
}
