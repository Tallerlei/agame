import {
  Character,
  CharacterClass,
  createCharacter,
  createDefaultStats,
  calculateExpToNextLevel,
  canEquipItem
} from './character.model';
import { ItemType, ItemRarity, WeaponType, ArmorClass, Weapon, Armor, Trinket } from './item.model';

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

  describe('canEquipItem', () => {
    function makeWeapon(weaponType: WeaponType, classRestriction?: string[]): Weapon {
      return {
        id: 'w1', name: 'Test Weapon', description: '', type: ItemType.WEAPON,
        rarity: ItemRarity.COMMON, value: 10, damage: 10, attackSpeed: 1, weaponType, classRestriction
      };
    }

    function makeArmor(armorClass: ArmorClass, classRestriction?: string[]): Armor {
      return {
        id: 'a1', name: 'Test Armor', description: '', type: ItemType.ARMOR,
        rarity: ItemRarity.COMMON, value: 10, defense: 5, armorClass, slot: 'chest', classRestriction
      };
    }

    function makeTrinket(): Trinket {
      return {
        id: 't1', name: 'Ring', description: '', type: ItemType.TRINKET,
        rarity: ItemRarity.COMMON, value: 10, statBonus: {}
      };
    }

    it('should allow Warrior to equip a Sword', () => {
      const warrior = createCharacter('W', CharacterClass.WARRIOR);
      const sword = makeWeapon(WeaponType.SWORD);
      expect(canEquipItem(warrior, sword).canEquip).toBeTrue();
    });

    it('should block Warrior from equipping a Staff (no classRestriction, type check)', () => {
      const warrior = createCharacter('W', CharacterClass.WARRIOR);
      const staff = makeWeapon(WeaponType.STAFF);
      const result = canEquipItem(warrior, staff);
      expect(result.canEquip).toBeFalse();
      expect(result.reason).toBeTruthy();
    });

    it('should allow Mage to equip a Staff', () => {
      const mage = createCharacter('M', CharacterClass.MAGE);
      const staff = makeWeapon(WeaponType.STAFF);
      expect(canEquipItem(mage, staff).canEquip).toBeTrue();
    });

    it('should block Mage from equipping a Sword (no classRestriction, type check)', () => {
      const mage = createCharacter('M', CharacterClass.MAGE);
      const sword = makeWeapon(WeaponType.SWORD);
      const result = canEquipItem(mage, sword);
      expect(result.canEquip).toBeFalse();
    });

    it('should allow Rogue to equip a Dagger', () => {
      const rogue = createCharacter('R', CharacterClass.ROGUE);
      const dagger = makeWeapon(WeaponType.DAGGER);
      expect(canEquipItem(rogue, dagger).canEquip).toBeTrue();
    });

    it('should block Rogue from equipping an Axe', () => {
      const rogue = createCharacter('R', CharacterClass.ROGUE);
      const axe = makeWeapon(WeaponType.AXE);
      expect(canEquipItem(rogue, axe).canEquip).toBeFalse();
    });

    it('should allow Healer to equip a Mace', () => {
      const healer = createCharacter('H', CharacterClass.HEALER);
      const mace = makeWeapon(WeaponType.MACE);
      expect(canEquipItem(healer, mace).canEquip).toBeTrue();
    });

    it('should respect explicit classRestriction over weapon type', () => {
      const warrior = createCharacter('W', CharacterClass.WARRIOR);
      // Sword with Rogue-only restriction
      const sword = makeWeapon(WeaponType.SWORD, ['ROGUE']);
      const result = canEquipItem(warrior, sword);
      expect(result.canEquip).toBeFalse();
      expect(result.reason).toContain('Rogue');
    });

    it('should allow class when it is in explicit classRestriction', () => {
      const rogue = createCharacter('R', CharacterClass.ROGUE);
      const sword = makeWeapon(WeaponType.SWORD, ['WARRIOR', 'ROGUE']);
      expect(canEquipItem(rogue, sword).canEquip).toBeTrue();
    });

    it('should allow Warrior to wear Heavy armor', () => {
      const warrior = createCharacter('W', CharacterClass.WARRIOR);
      expect(canEquipItem(warrior, makeArmor(ArmorClass.HEAVY)).canEquip).toBeTrue();
    });

    it('should block Mage from wearing Heavy armor', () => {
      const mage = createCharacter('M', CharacterClass.MAGE);
      expect(canEquipItem(mage, makeArmor(ArmorClass.HEAVY)).canEquip).toBeFalse();
    });

    it('should allow Mage to wear Light armor', () => {
      const mage = createCharacter('M', CharacterClass.MAGE);
      expect(canEquipItem(mage, makeArmor(ArmorClass.LIGHT)).canEquip).toBeTrue();
    });

    it('should block Mage from wearing Medium armor', () => {
      const mage = createCharacter('M', CharacterClass.MAGE);
      expect(canEquipItem(mage, makeArmor(ArmorClass.MEDIUM)).canEquip).toBeFalse();
    });

    it('should allow any class to equip a trinket (no restriction)', () => {
      const trinket = makeTrinket();
      [CharacterClass.WARRIOR, CharacterClass.MAGE, CharacterClass.ROGUE, CharacterClass.HEALER].forEach(cls => {
        const char = createCharacter('C', cls);
        expect(canEquipItem(char, trinket).canEquip).toBeTrue();
      });
    });

    it('should allow an armor with explicit classRestriction for Warrior only to be equipped by Warrior', () => {
      const warrior = createCharacter('W', CharacterClass.WARRIOR);
      const armor = makeArmor(ArmorClass.HEAVY, ['WARRIOR']);
      expect(canEquipItem(warrior, armor).canEquip).toBeTrue();
    });

    it('should block Rogue from armor with explicit Warrior-only classRestriction', () => {
      const rogue = createCharacter('R', CharacterClass.ROGUE);
      const armor = makeArmor(ArmorClass.MEDIUM, ['WARRIOR']);
      const result = canEquipItem(rogue, armor);
      expect(result.canEquip).toBeFalse();
      expect(result.reason).toBeTruthy();
    });
  });
});
