import {
  Character,
  CharacterClass,
  createCharacter,
  createDefaultStats,
  calculateExpToNextLevel
} from './character.model';

describe('Character Model', () => {
  describe('createDefaultStats', () => {
    it('should create warrior stats with higher strength and health', () => {
      const stats = createDefaultStats(CharacterClass.WARRIOR);
      expect(stats.strength).toBe(15);
      expect(stats.maxHealth).toBe(150);
      expect(stats.defense).toBe(10);
    });

    it('should create mage stats with higher intelligence and mana', () => {
      const stats = createDefaultStats(CharacterClass.MAGE);
      expect(stats.intelligence).toBe(18);
      expect(stats.maxMana).toBe(100);
    });

    it('should create rogue stats with higher agility', () => {
      const stats = createDefaultStats(CharacterClass.ROGUE);
      expect(stats.agility).toBe(18);
      expect(stats.attackPower).toBe(12);
    });

    it('should create healer stats with balanced stats', () => {
      const stats = createDefaultStats(CharacterClass.HEALER);
      expect(stats.intelligence).toBe(15);
      expect(stats.maxMana).toBe(80);
      expect(stats.maxHealth).toBe(120);
    });
  });

  describe('calculateExpToNextLevel', () => {
    it('should return 100 for level 1', () => {
      expect(calculateExpToNextLevel(1)).toBe(100);
    });

    it('should increase with level', () => {
      const level1Exp = calculateExpToNextLevel(1);
      const level2Exp = calculateExpToNextLevel(2);
      const level3Exp = calculateExpToNextLevel(3);
      
      expect(level2Exp).toBeGreaterThan(level1Exp);
      expect(level3Exp).toBeGreaterThan(level2Exp);
    });
  });

  describe('createCharacter', () => {
    it('should create a character with the given name and class', () => {
      const character = createCharacter('TestHero', CharacterClass.WARRIOR);
      
      expect(character.name).toBe('TestHero');
      expect(character.characterClass).toBe(CharacterClass.WARRIOR);
      expect(character.level).toBe(1);
      expect(character.experience).toBe(0);
    });

    it('should initialize character with empty inventory', () => {
      const character = createCharacter('TestHero', CharacterClass.MAGE);
      
      expect(character.inventory.items.length).toBe(0);
      expect(character.inventory.maxSize).toBe(10);
    });

    it('should initialize character with proper stats for class', () => {
      const warrior = createCharacter('Warrior', CharacterClass.WARRIOR);
      const mage = createCharacter('Mage', CharacterClass.MAGE);
      
      expect(warrior.stats.strength).toBeGreaterThan(mage.stats.strength);
      expect(mage.stats.intelligence).toBeGreaterThan(warrior.stats.intelligence);
    });

    it('should generate unique IDs for each character', () => {
      const char1 = createCharacter('Hero1', CharacterClass.WARRIOR);
      const char2 = createCharacter('Hero2', CharacterClass.WARRIOR);
      
      expect(char1.id).not.toBe(char2.id);
    });
  });
});
