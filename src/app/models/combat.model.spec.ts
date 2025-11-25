import {
  Enemy,
  createEnemy,
  calculateDamage,
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
});
