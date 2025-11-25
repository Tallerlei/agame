import {
  QuestDifficulty,
  getDifficultyMultiplier
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
});
