import { CharacterClass } from './character.model';
import { getSkillChoicesForLevel, SKILL_POOL } from './skill.model';
import { AbilityType } from './ability.model';

describe('Skill Model', () => {
  describe('SKILL_POOL', () => {
    it('should have skills for all four character classes', () => {
      expect(SKILL_POOL[CharacterClass.WARRIOR].length).toBeGreaterThan(0);
      expect(SKILL_POOL[CharacterClass.MAGE].length).toBeGreaterThan(0);
      expect(SKILL_POOL[CharacterClass.ROGUE].length).toBeGreaterThan(0);
      expect(SKILL_POOL[CharacterClass.HEALER].length).toBeGreaterThan(0);
    });

    it('should have exactly 3 skills per milestone tier (2 active + 1 passive) for each class', () => {
      const milestones = [5, 10, 15];
      const classes = [CharacterClass.WARRIOR, CharacterClass.MAGE, CharacterClass.ROGUE, CharacterClass.HEALER];

      for (const cls of classes) {
        for (const level of milestones) {
          const tier = SKILL_POOL[cls].filter(s => s.levelRequired === level);
          expect(tier.length).toBe(3, `Expected 3 skills for ${cls} at level ${level}`);
          const active = tier.filter(s => !s.isPassive);
          const passive = tier.filter(s => s.isPassive);
          expect(active.length).toBe(2, `Expected 2 active skills for ${cls} at level ${level}`);
          expect(passive.length).toBe(1, `Expected 1 passive skill for ${cls} at level ${level}`);
        }
      }
    });

    it('should have unique skill IDs across all classes', () => {
      const allIds = Object.values(SKILL_POOL).flatMap(skills => skills.map(s => s.id));
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('should set cooldownTurns to 0 for passive skills', () => {
      for (const skills of Object.values(SKILL_POOL)) {
        for (const skill of skills.filter(s => s.isPassive)) {
          expect(skill.cooldownTurns).toBe(0);
          expect(skill.manaCost).toBe(0);
          expect(skill.passiveBonus).toBeTruthy();
        }
      }
    });

    it('should mark passive skills with abilityType PASSIVE', () => {
      for (const skills of Object.values(SKILL_POOL)) {
        for (const skill of skills.filter(s => s.isPassive)) {
          expect(skill.abilityType).toBe(AbilityType.PASSIVE);
        }
      }
    });
  });

  describe('getSkillChoicesForLevel', () => {
    it('should return 3 choices for an unspecialized warrior at level 5', () => {
      const choices = getSkillChoicesForLevel(CharacterClass.WARRIOR, 5, []);
      expect(choices.length).toBe(3);
    });

    it('should return choices matching the requested milestone level', () => {
      const choices = getSkillChoicesForLevel(CharacterClass.MAGE, 5, []);
      expect(choices.every(c => c.levelRequired === 5)).toBeTrue();
    });

    it('should filter out already-unlocked skills', () => {
      const allLevel5 = SKILL_POOL[CharacterClass.WARRIOR].filter(s => s.levelRequired === 5);
      const firstSkillId = allLevel5[0].id;
      const choices = getSkillChoicesForLevel(CharacterClass.WARRIOR, 5, [firstSkillId]);
      expect(choices.find(c => c.id === firstSkillId)).toBeUndefined();
    });

    it('should return empty array when all skills at that level are already unlocked', () => {
      const allSkillIds = SKILL_POOL[CharacterClass.ROGUE].map(s => s.id);
      const choices = getSkillChoicesForLevel(CharacterClass.ROGUE, 5, allSkillIds);
      expect(choices.length).toBe(0);
    });

    it('should use fallback skills when exact tier is fully unlocked', () => {
      const level5Ids = SKILL_POOL[CharacterClass.WARRIOR]
        .filter(s => s.levelRequired === 5)
        .map(s => s.id);
      // Unlock all level-5 skills, ask for level 10 choices
      const choices = getSkillChoicesForLevel(CharacterClass.WARRIOR, 10, level5Ids);
      expect(choices.length).toBeGreaterThan(0);
      // All returned skills should be unlockable (levelRequired <= 10)
      expect(choices.every(c => c.levelRequired <= 10)).toBeTrue();
    });

    it('should include at most 3 choices', () => {
      const choices = getSkillChoicesForLevel(CharacterClass.HEALER, 15, []);
      expect(choices.length).toBeLessThanOrEqual(3);
    });
  });
});
