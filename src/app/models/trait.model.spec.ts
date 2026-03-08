import { ItemRarity } from './item.model';
import {
  TRAIT_DEFINITIONS,
  TRAIT_DROP_CHANCE,
  getTraitDefinitionByEnemy,
  TraitDefinition
} from './trait.model';

describe('Trait Model', () => {
  describe('TRAIT_DEFINITIONS', () => {
    it('should contain at least 4 trait definitions', () => {
      expect(TRAIT_DEFINITIONS.length).toBeGreaterThanOrEqual(4);
    });

    it('should have unique IDs', () => {
      const ids = TRAIT_DEFINITIONS.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have unique enemy names', () => {
      const names = TRAIT_DEFINITIONS.map(t => t.enemyName);
      expect(new Set(names).size).toBe(names.length);
    });

    it('should have negative effect chance between 0 and 1', () => {
      for (const def of TRAIT_DEFINITIONS) {
        expect(def.negativeEffect.chance).toBeGreaterThanOrEqual(0);
        expect(def.negativeEffect.chance).toBeLessThanOrEqual(1);
      }
    });

    it('should have positive amounts greater than 0', () => {
      for (const def of TRAIT_DEFINITIONS) {
        expect(def.positiveEffect.amount).toBeGreaterThan(0);
        expect(def.negativeEffect.amount).toBeGreaterThan(0);
      }
    });

    it('should scale risk level with negative chance (higher risk = higher chance)', () => {
      const low = TRAIT_DEFINITIONS.filter(t => t.riskLevel === 'low');
      const high = TRAIT_DEFINITIONS.filter(t => t.riskLevel === 'high');

      const avgLow = low.reduce((s, t) => s + t.negativeEffect.chance, 0) / low.length;
      const avgHigh = high.reduce((s, t) => s + t.negativeEffect.chance, 0) / high.length;
      expect(avgHigh).toBeGreaterThan(avgLow);
    });
  });

  describe('TRAIT_DROP_CHANCE', () => {
    it('should have drop chances for all rarities', () => {
      const rarities = [
        ItemRarity.COMMON,
        ItemRarity.UNCOMMON,
        ItemRarity.RARE,
        ItemRarity.EPIC,
        ItemRarity.LEGENDARY
      ];
      for (const rarity of rarities) {
        expect(TRAIT_DROP_CHANCE[rarity]).toBeGreaterThan(0);
        expect(TRAIT_DROP_CHANCE[rarity]).toBeLessThanOrEqual(1);
      }
    });

    it('should have common drops more often than rare drops', () => {
      expect(TRAIT_DROP_CHANCE[ItemRarity.COMMON]).toBeGreaterThan(TRAIT_DROP_CHANCE[ItemRarity.RARE]);
      expect(TRAIT_DROP_CHANCE[ItemRarity.RARE]).toBeGreaterThan(TRAIT_DROP_CHANCE[ItemRarity.LEGENDARY]);
    });
  });

  describe('getTraitDefinitionByEnemy', () => {
    it('should find trait definition by exact enemy name', () => {
      const def = getTraitDefinitionByEnemy('Goblin');
      expect(def).toBeTruthy();
      expect(def?.enemyName).toBe('Goblin');
    });

    it('should find trait definition case-insensitively', () => {
      const def = getTraitDefinitionByEnemy('goblin');
      expect(def).toBeTruthy();
    });

    it('should return undefined for unknown enemy', () => {
      const def = getTraitDefinitionByEnemy('Dragon');
      expect(def).toBeUndefined();
    });

    it('should find Orc trait', () => {
      const def = getTraitDefinitionByEnemy('Orc');
      expect(def?.id).toBe('orc-heart');
      expect(def?.name).toBe('Orc Heart');
    });
  });
});
