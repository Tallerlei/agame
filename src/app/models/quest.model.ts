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
