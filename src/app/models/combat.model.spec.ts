import {
  Enemy,
  createEnemy,
  calculateDamage,
  calculateDamageResult,
  getEnemyEmoji,
  CombatActionType
} from './combat.model';

describe('Combat Model', () => {
  describe('createEnemy', () => {
    it('should create an enemy with the given name and level', () => {
      const enemy = createEnemy('Goblin', 1);
      
      expect(enemy.name).toBe('Goblin');
      expect(enemy.level).toBe(1);
    });

    it('should scale enemy stats with level', () => {
      const level1Enemy = createEnemy('Goblin', 1);
      const level5Enemy = createEnemy('Goblin', 5);
      
      expect(level5Enemy.maxHealth).toBeGreaterThan(level1Enemy.maxHealth);
      expect(level5Enemy.attackPower).toBeGreaterThan(level1Enemy.attackPower);
      expect(level5Enemy.experienceReward).toBeGreaterThan(level1Enemy.experienceReward);
    });

    it('should set currentHealth equal to maxHealth', () => {
      const enemy = createEnemy('Orc', 3);
      expect(enemy.currentHealth).toBe(enemy.maxHealth);
    });

    it('should generate unique IDs', () => {
      const enemy1 = createEnemy('Goblin', 1);
      const enemy2 = createEnemy('Goblin', 1);
      
      expect(enemy1.id).not.toBe(enemy2.id);
    });

    it('should assign an emoji for known enemy names', () => {
      expect(createEnemy('Goblin', 1).emoji).toBe('👺');
      expect(createEnemy('Orc', 1).emoji).toBe('👹');
      expect(createEnemy('Skeleton', 1).emoji).toBe('💀');
      expect(createEnemy('Wolf', 1).emoji).toBe('🐺');
      expect(createEnemy('Dragon', 1).emoji).toBe('🐉');
    });

    it('should assign a fallback emoji for unknown enemy names', () => {
      expect(createEnemy('Unknown Beast', 1).emoji).toBe('👿');
    });
  });

  describe('getEnemyEmoji', () => {
    it('should return the correct emoji for known enemies', () => {
      expect(getEnemyEmoji('Goblin')).toBe('👺');
      expect(getEnemyEmoji('Dragon')).toBe('🐉');
      expect(getEnemyEmoji('Guardian')).toBe('🛡️');
      expect(getEnemyEmoji('Cave Troll')).toBe('🧌');
    });

    it('should return the fallback emoji for unknown enemies', () => {
      expect(getEnemyEmoji('Zombie')).toBe('👿');
      expect(getEnemyEmoji('')).toBe('👿');
    });
  });

  describe('calculateDamage', () => {
    it('should return at least 1 damage', () => {
      const damage = calculateDamage(1, 100);
      expect(damage).toBeGreaterThanOrEqual(1);
    });

    it('should deal more damage with higher attack power', () => {
      // Run multiple times to account for variance
      let highAttackTotal = 0;
      let lowAttackTotal = 0;
      
      for (let i = 0; i < 100; i++) {
        highAttackTotal += calculateDamage(50, 10);
        lowAttackTotal += calculateDamage(20, 10);
      }
      
      expect(highAttackTotal).toBeGreaterThan(lowAttackTotal);
    });

    it('should deal less damage against higher defense', () => {
      // Run multiple times to account for variance
      let lowDefenseTotal = 0;
      let highDefenseTotal = 0;
      
      for (let i = 0; i < 100; i++) {
        lowDefenseTotal += calculateDamage(30, 5);
        highDefenseTotal += calculateDamage(30, 20);
      }
      
      expect(lowDefenseTotal).toBeGreaterThan(highDefenseTotal);
    });
  });

  describe('calculateDamageResult', () => {
    it('should return at least 1 damage', () => {
      const result = calculateDamageResult(1, 100);
      expect(result.damage).toBeGreaterThanOrEqual(1);
    });

    it('should return an isCritical boolean', () => {
      const result = calculateDamageResult(20, 5);
      expect(typeof result.isCritical).toBe('boolean');
    });

    it('should deal more damage on a critical hit than a non-critical hit on average', () => {
      // Force 100% crit chance and compare with 0% crit chance over many samples
      let critTotal = 0;
      let noCritTotal = 0;
      for (let i = 0; i < 100; i++) {
        critTotal += calculateDamageResult(20, 5, 1).damage;
        noCritTotal += calculateDamageResult(20, 5, 0).damage;
      }
      expect(critTotal).toBeGreaterThan(noCritTotal);
    });

    it('should always be a critical hit when critChance is 1', () => {
      for (let i = 0; i < 10; i++) {
        expect(calculateDamageResult(20, 5, 1).isCritical).toBe(true);
      }
    });

    it('should never be a critical hit when critChance is 0', () => {
      for (let i = 0; i < 10; i++) {
        expect(calculateDamageResult(20, 5, 0).isCritical).toBe(false);
      }
    });
  });
});
