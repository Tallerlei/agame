import { TestBed } from '@angular/core/testing';
import { QuestService } from './quest.service';
import { CharacterService } from './character.service';
import { CharacterClass, createCharacter } from '../models/character.model';
import { ObjectiveType, QuestDifficulty, QuestStatus } from '../models/quest.model';

describe('QuestService', () => {
  let service: QuestService;
  let characterService: CharacterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QuestService, CharacterService]
    });
    service = TestBed.inject(QuestService);
    characterService = TestBed.inject(CharacterService);
  });

  describe('initial quests', () => {
    it('should have initial quests available', () => {
      expect(service.availableQuests().length).toBeGreaterThan(0);
    });

    it('should have quests with proper boss names for BOSS_FIGHT objectives', () => {
      const quests = service.availableQuests();
      const questsWithBoss = quests.filter(q =>
        q.objectives.some(obj => obj.type === ObjectiveType.BOSS_FIGHT)
      );
      expect(questsWithBoss.length).toBeGreaterThan(0);

      for (const quest of questsWithBoss) {
        const bossObj = quest.objectives.find(obj => obj.type === ObjectiveType.BOSS_FIGHT);
        expect(bossObj?.targetBossName).toBeTruthy();
      }
    });

    it('should have quests with proper item names for COLLECT_ITEMS objectives', () => {
      const quests = service.availableQuests();
      const questsWithItems = quests.filter(q =>
        q.objectives.some(obj => obj.type === ObjectiveType.COLLECT_ITEMS)
      );
      expect(questsWithItems.length).toBeGreaterThan(0);

      for (const quest of questsWithItems) {
        const itemObj = quest.objectives.find(obj => obj.type === ObjectiveType.COLLECT_ITEMS);
        expect(itemObj?.targetItemName).toBeTruthy();
      }
    });

    it('should have quests with questEnemies defined', () => {
      const quests = service.availableQuests();
      const questsWithEnemies = quests.filter(q => q.questEnemies && q.questEnemies.length > 0);
      expect(questsWithEnemies.length).toBeGreaterThan(0);
    });
  });

  describe('getQuestContextEnemy', () => {
    it('should return null when no quests are active', () => {
      const result = service.getQuestContextEnemy(1);
      expect(result).toBeNull();
    });

    it('should return a quest-relevant enemy when a quest is active', () => {
      const character = createCharacter('TestHero', CharacterClass.WARRIOR);
      characterService['_characters'].set([character]);
      characterService['_activeCharacter'].set(character);

      // Start the Goblin Menace quest (requires level 1)
      const goblinQuest = service.availableQuests().find(q => q.name === 'Goblin Menace');
      expect(goblinQuest).toBeTruthy();

      service.startQuest(goblinQuest!.id, character.id);
      expect(service.activeQuests().length).toBe(1);

      // With the Goblin quest active, enemy selection should frequently return Goblin
      let goblinCount = 0;
      const trials = 100;
      for (let i = 0; i < trials; i++) {
        const result = service.getQuestContextEnemy(character.level);
        if (result && result.name === 'Goblin') {
          goblinCount++;
        }
      }
      // With 70% chance, we should see goblins the majority of the time
      expect(goblinCount).toBeGreaterThan(trials * 0.4);
    });
  });

  describe('incrementCombatCounter', () => {
    it('should increment combat count for active quests', () => {
      const character = createCharacter('TestHero', CharacterClass.WARRIOR);
      characterService['_characters'].set([character]);
      characterService['_activeCharacter'].set(character);

      const quest = service.availableQuests().find(q => q.name === 'Goblin Menace');
      service.startQuest(quest!.id, character.id);

      const countBefore = service.activeQuests()[0].combatCount ?? 0;
      service.incrementCombatCounter();
      const countAfter = service.activeQuests()[0].combatCount ?? 0;

      expect(countAfter).toBe(countBefore + 1);
    });
  });

  describe('recordBossDefeat', () => {
    it('should progress BOSS_FIGHT objective when boss is defeated', () => {
      const character = createCharacter('TestHero', CharacterClass.WARRIOR);
      character.level = 10;
      characterService['_characters'].set([character]);
      characterService['_activeCharacter'].set(character);

      const dragonQuest = service.availableQuests().find(q => q.name === "Dragon's Lair");
      expect(dragonQuest).toBeTruthy();

      service.startQuest(dragonQuest!.id, character.id);

      // Complete the explore objective first
      const exploreObj = service.activeQuests()[0].objectives.find(
        obj => obj.type === ObjectiveType.EXPLORE_LOCATION
      );
      service.updateObjective(exploreObj!.id, 1);

      // Now defeat the boss
      service.recordBossDefeat('Dragon');

      const bossObj = service.activeQuests().length > 0
        ? service.activeQuests()[0]?.objectives.find(obj => obj.type === ObjectiveType.BOSS_FIGHT)
        : null;

      // Either the boss objective was completed (quest might have completed entirely)
      // or it was progressed
      if (bossObj) {
        expect(bossObj.currentCount).toBeGreaterThan(0);
      } else {
        // Quest completed and moved to pending
        expect(service.pendingCompletion()).toBeTruthy();
      }
    });
  });

  describe('recordItemCollected', () => {
    it('should progress COLLECT_ITEMS objective when item is collected', () => {
      const character = createCharacter('TestHero', CharacterClass.WARRIOR);
      character.level = 5;
      characterService['_characters'].set([character]);
      characterService['_activeCharacter'].set(character);

      const ruinsQuest = service.availableQuests().find(q => q.name === 'The Ancient Ruins');
      expect(ruinsQuest).toBeTruthy();

      service.startQuest(ruinsQuest!.id, character.id);

      const collectObj = service.activeQuests()[0].objectives.find(
        obj => obj.type === ObjectiveType.COLLECT_ITEMS
      );
      expect(collectObj?.currentCount).toBe(0);

      service.recordItemCollected('Ancient Artifact');

      const updatedCollectObj = service.activeQuests()[0].objectives.find(
        obj => obj.type === ObjectiveType.COLLECT_ITEMS
      );
      expect(updatedCollectObj?.currentCount).toBe(1);
    });
  });

  describe('getQuestProgressHint', () => {
    it('should return a hint for quests with COLLECT_ITEMS objectives', () => {
      const character = createCharacter('TestHero', CharacterClass.WARRIOR);
      character.level = 5;
      characterService['_characters'].set([character]);
      characterService['_activeCharacter'].set(character);

      const ruinsQuest = service.availableQuests().find(q => q.name === 'The Ancient Ruins');
      service.startQuest(ruinsQuest!.id, character.id);

      const hint = service.getQuestProgressHint(service.activeQuests()[0]);
      expect(hint).toContain('Ancient Artifact');
    });

    it('should return a boss hint when combat count approaches threshold', () => {
      const character = createCharacter('TestHero', CharacterClass.WARRIOR);
      character.level = 10;
      characterService['_characters'].set([character]);
      characterService['_activeCharacter'].set(character);

      const dragonQuest = service.availableQuests().find(q => q.name === "Dragon's Lair");
      service.startQuest(dragonQuest!.id, character.id);

      // Complete the explore objective
      const exploreObj = service.activeQuests()[0].objectives.find(
        obj => obj.type === ObjectiveType.EXPLORE_LOCATION
      );
      service.updateObjective(exploreObj!.id, 1);

      // Increment combat counter to near threshold (LEGENDARY = 10 threshold)
      for (let i = 0; i < 10; i++) {
        service.incrementCombatCounter();
      }

      const hint = service.getQuestProgressHint(service.activeQuests()[0]);
      expect(hint).toContain('Dragon');
    });
  });

  describe('recordEnemyDefeat', () => {
    it('should progress DEFEAT_ENEMIES objectives with matching enemy type', () => {
      const character = createCharacter('TestHero', CharacterClass.WARRIOR);
      characterService['_characters'].set([character]);
      characterService['_activeCharacter'].set(character);

      const quest = service.availableQuests().find(q => q.name === 'Goblin Menace');
      service.startQuest(quest!.id, character.id);

      service.recordEnemyDefeat('Goblin');

      const defeatObj = service.activeQuests()[0].objectives.find(
        obj => obj.type === ObjectiveType.DEFEAT_ENEMIES
      );
      expect(defeatObj?.currentCount).toBe(1);
    });

    it('should not progress DEFEAT_ENEMIES objectives with non-matching enemy type', () => {
      const character = createCharacter('TestHero', CharacterClass.WARRIOR);
      characterService['_characters'].set([character]);
      characterService['_activeCharacter'].set(character);

      const quest = service.availableQuests().find(q => q.name === 'Goblin Menace');
      service.startQuest(quest!.id, character.id);

      service.recordEnemyDefeat('Orc');

      const defeatObj = service.activeQuests()[0].objectives.find(
        obj => obj.type === ObjectiveType.DEFEAT_ENEMIES
      );
      expect(defeatObj?.currentCount).toBe(0);
    });
  });
});
