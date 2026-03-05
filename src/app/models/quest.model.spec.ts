import {
  QuestDifficulty,
  getDifficultyMultiplier,
  getBossSpawnThreshold,
  getItemDropThreshold,
  QuestObjective,
  ObjectiveType
} from './quest.model';

describe('Quest Model', () => {
  describe('getDifficultyMultiplier', () => {
    it('should return 1 for easy difficulty', () => {
      expect(getDifficultyMultiplier(QuestDifficulty.EASY)).toBe(1);
    });

    it('should return 1.5 for medium difficulty', () => {
      expect(getDifficultyMultiplier(QuestDifficulty.MEDIUM)).toBe(1.5);
    });

    it('should return 2.5 for hard difficulty', () => {
      expect(getDifficultyMultiplier(QuestDifficulty.HARD)).toBe(2.5);
    });

    it('should return 5 for legendary difficulty', () => {
      expect(getDifficultyMultiplier(QuestDifficulty.LEGENDARY)).toBe(5);
    });

    it('should increase multipliers with difficulty', () => {
      const easy = getDifficultyMultiplier(QuestDifficulty.EASY);
      const medium = getDifficultyMultiplier(QuestDifficulty.MEDIUM);
      const hard = getDifficultyMultiplier(QuestDifficulty.HARD);
      const legendary = getDifficultyMultiplier(QuestDifficulty.LEGENDARY);
      
      expect(medium).toBeGreaterThan(easy);
      expect(hard).toBeGreaterThan(medium);
      expect(legendary).toBeGreaterThan(hard);
    });
  });

  describe('getBossSpawnThreshold', () => {
    it('should return lower threshold for easier difficulties', () => {
      const easy = getBossSpawnThreshold(QuestDifficulty.EASY);
      const medium = getBossSpawnThreshold(QuestDifficulty.MEDIUM);
      const hard = getBossSpawnThreshold(QuestDifficulty.HARD);
      const legendary = getBossSpawnThreshold(QuestDifficulty.LEGENDARY);

      expect(easy).toBeLessThan(medium);
      expect(medium).toBeLessThan(hard);
      expect(hard).toBeLessThan(legendary);
    });

    it('should return 3 for easy difficulty', () => {
      expect(getBossSpawnThreshold(QuestDifficulty.EASY)).toBe(3);
    });

    it('should return 10 for legendary difficulty', () => {
      expect(getBossSpawnThreshold(QuestDifficulty.LEGENDARY)).toBe(10);
    });
  });

  describe('getItemDropThreshold', () => {
    it('should return lower threshold for easier difficulties', () => {
      const easy = getItemDropThreshold(QuestDifficulty.EASY);
      const medium = getItemDropThreshold(QuestDifficulty.MEDIUM);
      const hard = getItemDropThreshold(QuestDifficulty.HARD);
      const legendary = getItemDropThreshold(QuestDifficulty.LEGENDARY);

      expect(easy).toBeLessThanOrEqual(medium);
      expect(medium).toBeLessThanOrEqual(hard);
      expect(hard).toBeLessThanOrEqual(legendary);
    });

    it('should return 3 for easy difficulty', () => {
      expect(getItemDropThreshold(QuestDifficulty.EASY)).toBe(3);
    });

    it('should return 8 for legendary difficulty', () => {
      expect(getItemDropThreshold(QuestDifficulty.LEGENDARY)).toBe(8);
    });
  });

  describe('QuestObjective targetEnemyType', () => {
    it('should allow creating a DEFEAT_ENEMIES objective without targetEnemyType', () => {
      const objective: QuestObjective = {
        id: '1',
        type: ObjectiveType.DEFEAT_ENEMIES,
        description: 'Defeat 5 enemies',
        targetCount: 5,
        currentCount: 0,
        completed: false
      };

      expect(objective.targetEnemyType).toBeUndefined();
    });

    it('should allow creating a DEFEAT_ENEMIES objective with targetEnemyType', () => {
      const objective: QuestObjective = {
        id: '1',
        type: ObjectiveType.DEFEAT_ENEMIES,
        description: 'Defeat 3 goblins',
        targetCount: 3,
        currentCount: 0,
        completed: false,
        targetEnemyType: 'Goblin'
      };

      expect(objective.targetEnemyType).toBe('Goblin');
    });
  });

  describe('QuestObjective targetBossName', () => {
    it('should allow creating a BOSS_FIGHT objective with targetBossName', () => {
      const objective: QuestObjective = {
        id: '1',
        type: ObjectiveType.BOSS_FIGHT,
        description: 'Defeat the Dragon',
        targetCount: 1,
        currentCount: 0,
        completed: false,
        targetBossName: 'Dragon'
      };

      expect(objective.targetBossName).toBe('Dragon');
    });
  });

  describe('QuestObjective targetItemName', () => {
    it('should allow creating a COLLECT_ITEMS objective with targetItemName', () => {
      const objective: QuestObjective = {
        id: '1',
        type: ObjectiveType.COLLECT_ITEMS,
        description: 'Collect ancient artifacts',
        targetCount: 3,
        currentCount: 0,
        completed: false,
        targetItemName: 'Ancient Artifact'
      };

      expect(objective.targetItemName).toBe('Ancient Artifact');
    });
  });
});
