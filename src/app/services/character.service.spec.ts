import { TestBed } from '@angular/core/testing';
import { CharacterService } from './character.service';
import { ItemService } from './item.service';
import { CharacterClass, createCharacter } from '../models/character.model';
import { ItemType, ItemRarity, BodyPartItem } from '../models/item.model';
import { SKILL_POOL } from '../models/skill.model';
import { TRAIT_DEFINITIONS } from '../models/trait.model';

describe('CharacterService – Skill System', () => {
  let service: CharacterService;
  let characterId: string;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CharacterService, ItemService] });
    service = TestBed.inject(CharacterService);
    service.createCharacter('Hero', CharacterClass.WARRIOR);
    characterId = service.characters()[0].id;
  });

  it('should return skill choices for a milestone level', () => {
    const char = service.characters()[0];
    const choices = service.getSkillChoicesForLevel(char, 5);
    expect(choices.length).toBe(3);
  });

  it('should add a skill to character abilities on learnSkill', () => {
    const skill = SKILL_POOL[CharacterClass.WARRIOR].find(s => s.id === 'cleave')!;
    service.learnSkill(characterId, skill);
    const abilities = service.characters()[0].abilities;
    const found = abilities.find(a => a.id === 'cleave');
    expect(found).toBeTruthy();
    expect(found!.isSkill).toBeTrue();
  });

  it('should record skill ID in unlockedSkillIds after learning', () => {
    const skill = SKILL_POOL[CharacterClass.WARRIOR].find(s => s.id === 'power-slam')!;
    service.learnSkill(characterId, skill);
    expect(service.characters()[0].unlockedSkillIds).toContain('power-slam');
  });

  it('should apply passive bonus to stats when learning a passive skill', () => {
    const passiveSkill = SKILL_POOL[CharacterClass.WARRIOR].find(s => s.id === 'iron-skin')!;
    const defenseBefore = service.characters()[0].stats.defense;
    service.learnSkill(characterId, passiveSkill);
    const defenseAfter = service.characters()[0].stats.defense;
    expect(defenseAfter).toBe(defenseBefore + (passiveSkill.passiveBonus?.defense ?? 0));
  });

  it('should filter out already-unlocked skills in getSkillChoicesForLevel', () => {
    const skill = SKILL_POOL[CharacterClass.WARRIOR].find(s => s.id === 'iron-skin')!;
    service.learnSkill(characterId, skill);
    const char = service.characters()[0];
    const choices = service.getSkillChoicesForLevel(char, 5);
    expect(choices.find(c => c.id === 'iron-skin')).toBeUndefined();
  });
});

describe('CharacterService – resetState', () => {
  let service: CharacterService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CharacterService] });
    service = TestBed.inject(CharacterService);
  });

  it('should clear all characters on resetState', () => {
    service.createCharacter('Hero', CharacterClass.WARRIOR);
    expect(service.characters().length).toBe(1);
    service.resetState();
    expect(service.characters().length).toBe(0);
  });

  it('should set activeCharacter to null on resetState', () => {
    service.createCharacter('Hero', CharacterClass.WARRIOR);
    expect(service.activeCharacter()).not.toBeNull();
    service.resetState();
    expect(service.activeCharacter()).toBeNull();
  });
});

describe('CharacterService – Trait System', () => {
  let service: CharacterService;
  let characterId: string;

  function makeBodyPartItem(traitId: string, timesConsumed = 0): BodyPartItem {
    return {
      id: crypto.randomUUID(),
      name: 'Test Part',
      description: '',
      type: ItemType.BODY_PART,
      rarity: ItemRarity.COMMON,
      value: 0,
      traitDefinitionId: traitId,
      timesConsumed
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CharacterService, ItemService] });
    service = TestBed.inject(CharacterService);
    service.createCharacter('Hero', CharacterClass.WARRIOR);
    characterId = service.characters()[0].id;
  });

  it('should return failure result for unknown trait definition', () => {
    const item = makeBodyPartItem('nonexistent');
    const result = service.consumeBodyPart(characterId, item);
    expect(result.success).toBeFalse();
  });

  it('should report first consumption as blind', () => {
    const def = TRAIT_DEFINITIONS[0];
    const item = makeBodyPartItem(def.id, 0);
    service.addItemToInventory(characterId, item);
    const result = service.consumeBodyPart(characterId, item);
    expect(result.success).toBeTrue();
    expect(result.wasBlind).toBeTrue();
    expect(result.message).toContain('Unknown');
  });

  it('should report second consumption as non-blind with effect details', () => {
    const def = TRAIT_DEFINITIONS[0];
    const item = makeBodyPartItem(def.id, 1);
    service.addItemToInventory(characterId, item);
    const result = service.consumeBodyPart(characterId, item);
    expect(result.wasBlind).toBeFalse();
    expect(result.message).toContain(def.name);
  });

  it('should add trait to character after consuming body part', () => {
    const def = TRAIT_DEFINITIONS.find(t => t.id === 'goblin-ear')!;
    const item = makeBodyPartItem(def.id, 0);
    service.addItemToInventory(characterId, item);
    service.consumeBodyPart(characterId, item);
    const traits = service.characters()[0].traits;
    expect(traits.find(t => t.definitionId === 'goblin-ear')).toBeTruthy();
  });

  it('should apply positive effect to stats permanently', () => {
    const def = TRAIT_DEFINITIONS.find(t => t.id === 'wolf-claw')!;
    const item = makeBodyPartItem(def.id, 0);
    service.addItemToInventory(characterId, item);
    const atkBefore = service.characters()[0].stats.attackPower;
    service.consumeBodyPart(characterId, item);
    const atkAfter = service.characters()[0].stats.attackPower;
    expect(atkAfter).toBe(atkBefore + def.positiveEffect.amount);
  });

  it('should remove body part from inventory after consuming', () => {
    const def = TRAIT_DEFINITIONS[0];
    const item = makeBodyPartItem(def.id, 0);
    service.addItemToInventory(characterId, item);
    service.consumeBodyPart(characterId, item);
    const items = service.characters()[0].inventory.items;
    expect(items.find(i => i.id === item.id)).toBeUndefined();
  });

  it('should cap traits at 5 and return atTraitCap=true', () => {
    // Add 5 traits by consuming 5 different body parts
    const defs = TRAIT_DEFINITIONS.slice(0, 5);
    for (const def of defs) {
      const item = makeBodyPartItem(def.id, 0);
      service.addItemToInventory(characterId, item);
      service.consumeBodyPart(characterId, item);
    }
    expect(service.characters()[0].traits.length).toBe(5);

    // Try to add a 6th (if one exists)
    if (TRAIT_DEFINITIONS.length > 5) {
      const extraDef = TRAIT_DEFINITIONS[5];
      const extraItem = makeBodyPartItem(extraDef.id, 0);
      service.addItemToInventory(characterId, extraItem);
      const result = service.consumeBodyPart(characterId, extraItem);
      expect(result.atTraitCap).toBeTrue();
      expect(service.characters()[0].traits.length).toBe(5);
    }
  });

  it('should increment consumeCount on re-consuming same trait type', () => {
    const def = TRAIT_DEFINITIONS[0];
    const item1 = makeBodyPartItem(def.id, 0);
    service.addItemToInventory(characterId, item1);
    service.consumeBodyPart(characterId, item1);

    const item2 = makeBodyPartItem(def.id, 1);
    service.addItemToInventory(characterId, item2);
    service.consumeBodyPart(characterId, item2);

    const trait = service.characters()[0].traits.find(t => t.definitionId === def.id);
    expect(trait?.consumeCount).toBe(2);
  });

  it('should decrement negativeDebuffRemainingFights on decrementTraitFights', () => {
    const def = TRAIT_DEFINITIONS.find(t => t.id === 'orc-heart')!;
    const item = makeBodyPartItem(def.id, 0);
    service.addItemToInventory(characterId, item);

    // Force negative debuff active by seeding the random call
    spyOn(Math, 'random').and.returnValue(0.01); // < 0.35 chance → triggers
    service.consumeBodyPart(characterId, item);

    const traitBefore = service.characters()[0].traits.find(t => t.definitionId === def.id);
    if (traitBefore?.negativeDebuffActive) {
      const remaining = traitBefore.negativeDebuffRemainingFights;
      service.decrementTraitFights(characterId);
      const traitAfter = service.characters()[0].traits.find(t => t.definitionId === def.id);
      expect(traitAfter!.negativeDebuffRemainingFights).toBe(remaining - 1);
    }
  });
});
