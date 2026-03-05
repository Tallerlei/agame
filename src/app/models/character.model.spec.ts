import {
  Character,
  CharacterClass,
  createCharacter,
  createDefaultStats,
  calculateExpToNextLevel,
  getAllowedWeaponTypes,
  getAllowedArmorClasses,
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

  describe('getAllowedWeaponTypes', () => {
    it('should allow warrior to use swords, axes, and maces', () => {
      const allowed = getAllowedWeaponTypes(CharacterClass.WARRIOR);
      expect(allowed).toContain(WeaponType.SWORD);
      expect(allowed).toContain(WeaponType.AXE);
      expect(allowed).toContain(WeaponType.MACE);
      expect(allowed).not.toContain(WeaponType.STAFF);
      expect(allowed).not.toContain(WeaponType.DAGGER);
      expect(allowed).not.toContain(WeaponType.BOW);
    });

    it('should allow mage to use only staffs', () => {
      const allowed = getAllowedWeaponTypes(CharacterClass.MAGE);
      expect(allowed).toContain(WeaponType.STAFF);
      expect(allowed).not.toContain(WeaponType.SWORD);
    });

    it('should allow rogue to use daggers and bows', () => {
      const allowed = getAllowedWeaponTypes(CharacterClass.ROGUE);
      expect(allowed).toContain(WeaponType.DAGGER);
      expect(allowed).toContain(WeaponType.BOW);
      expect(allowed).not.toContain(WeaponType.SWORD);
    });

    it('should allow healer to use staffs and maces', () => {
      const allowed = getAllowedWeaponTypes(CharacterClass.HEALER);
      expect(allowed).toContain(WeaponType.STAFF);
      expect(allowed).toContain(WeaponType.MACE);
      expect(allowed).not.toContain(WeaponType.SWORD);
    });
  });

  describe('getAllowedArmorClasses', () => {
    it('should allow warrior to wear heavy, medium, and light armor', () => {
      const allowed = getAllowedArmorClasses(CharacterClass.WARRIOR);
      expect(allowed).toContain(ArmorClass.HEAVY);
      expect(allowed).toContain(ArmorClass.MEDIUM);
      expect(allowed).toContain(ArmorClass.LIGHT);
    });

    it('should restrict mage to light armor only', () => {
      const allowed = getAllowedArmorClasses(CharacterClass.MAGE);
      expect(allowed).toContain(ArmorClass.LIGHT);
      expect(allowed).not.toContain(ArmorClass.MEDIUM);
      expect(allowed).not.toContain(ArmorClass.HEAVY);
    });

    it('should allow rogue to wear light and medium armor', () => {
      const allowed = getAllowedArmorClasses(CharacterClass.ROGUE);
      expect(allowed).toContain(ArmorClass.LIGHT);
      expect(allowed).toContain(ArmorClass.MEDIUM);
      expect(allowed).not.toContain(ArmorClass.HEAVY);
    });

    it('should allow healer to wear light and medium armor', () => {
      const allowed = getAllowedArmorClasses(CharacterClass.HEALER);
      expect(allowed).toContain(ArmorClass.LIGHT);
      expect(allowed).toContain(ArmorClass.MEDIUM);
      expect(allowed).not.toContain(ArmorClass.HEAVY);
    });
  });

  describe('canEquipItem', () => {
    const makeWeapon = (weaponType: WeaponType): Weapon => ({
      id: 'w1', name: 'Test', description: '', type: ItemType.WEAPON,
      rarity: ItemRarity.COMMON, value: 1, damage: 10, attackSpeed: 1, weaponType
    });
    const makeArmor = (armorClass: ArmorClass): Armor => ({
      id: 'a1', name: 'Test', description: '', type: ItemType.ARMOR,
      rarity: ItemRarity.COMMON, value: 1, defense: 5, slot: 'chest', armorClass
    });
    const makeTrinket = (): Trinket => ({
      id: 't1', name: 'Test', description: '', type: ItemType.TRINKET,
      rarity: ItemRarity.COMMON, value: 1, statBonus: { strength: 1 }
    });

    it('should allow warrior to equip a sword', () => {
      const char = createCharacter('Warrior', CharacterClass.WARRIOR);
      expect(canEquipItem(char, makeWeapon(WeaponType.SWORD))).toBeTrue();
    });

    it('should prevent warrior from equipping a staff', () => {
      const char = createCharacter('Warrior', CharacterClass.WARRIOR);
      expect(canEquipItem(char, makeWeapon(WeaponType.STAFF))).toBeFalse();
    });

    it('should allow mage to equip a staff', () => {
      const char = createCharacter('Mage', CharacterClass.MAGE);
      expect(canEquipItem(char, makeWeapon(WeaponType.STAFF))).toBeTrue();
    });

    it('should prevent mage from equipping a sword', () => {
      const char = createCharacter('Mage', CharacterClass.MAGE);
      expect(canEquipItem(char, makeWeapon(WeaponType.SWORD))).toBeFalse();
    });

    it('should allow warrior to wear heavy armor', () => {
      const char = createCharacter('Warrior', CharacterClass.WARRIOR);
      expect(canEquipItem(char, makeArmor(ArmorClass.HEAVY))).toBeTrue();
    });

    it('should prevent mage from wearing heavy armor', () => {
      const char = createCharacter('Mage', CharacterClass.MAGE);
      expect(canEquipItem(char, makeArmor(ArmorClass.HEAVY))).toBeFalse();
    });

    it('should allow all classes to equip trinkets', () => {
      const trinket = makeTrinket();
      expect(canEquipItem(createCharacter('W', CharacterClass.WARRIOR), trinket)).toBeTrue();
      expect(canEquipItem(createCharacter('M', CharacterClass.MAGE), trinket)).toBeTrue();
      expect(canEquipItem(createCharacter('R', CharacterClass.ROGUE), trinket)).toBeTrue();
      expect(canEquipItem(createCharacter('H', CharacterClass.HEALER), trinket)).toBeTrue();
    });

    it('should allow rogue to equip a dagger but not an axe', () => {
      const char = createCharacter('Rogue', CharacterClass.ROGUE);
      expect(canEquipItem(char, makeWeapon(WeaponType.DAGGER))).toBeTrue();
      expect(canEquipItem(char, makeWeapon(WeaponType.AXE))).toBeFalse();
    });
  });
});
