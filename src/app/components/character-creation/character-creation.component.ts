import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../services/character.service';
import { CharacterClass } from '../../models/character.model';

@Component({
  selector: 'app-character-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="character-creation">
      <h2>Create Your Hero</h2>
      
      <div class="form-group">
        <label for="name">Character Name</label>
        <input
          type="text"
          id="name"
          [(ngModel)]="characterName"
          placeholder="Enter name..."
          maxlength="20"
        />
      </div>

      <div class="class-selection">
        <h3>Choose Your Class</h3>
        <div class="class-options">
          @for (charClass of classes; track charClass.type) {
            <button
              class="class-option"
              [class.selected]="selectedClass === charClass.type"
              (click)="selectClass(charClass.type)"
            >
              <span class="class-icon">{{ charClass.icon }}</span>
              <span class="class-name">{{ charClass.name }}</span>
              <span class="class-desc">{{ charClass.description }}</span>
            </button>
          }
        </div>
      </div>

      <button
        class="create-btn"
        [disabled]="!canCreate()"
        (click)="createCharacter()"
      >
        Create Character
      </button>
    </div>
  `,
  styles: [`
    .character-creation {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    h2 {
      text-align: center;
      color: #ffd700;
      margin-bottom: 2rem;
      font-size: 2rem;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      color: #e0e0e0;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #4a4a6a;
      border-radius: 8px;
      background: #2a2a4a;
      color: #fff;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    input:focus {
      outline: none;
      border-color: #ffd700;
    }

    h3 {
      color: #e0e0e0;
      margin-bottom: 1rem;
    }

    .class-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .class-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem 1rem;
      border: 2px solid #4a4a6a;
      border-radius: 12px;
      background: #2a2a4a;
      color: #e0e0e0;
      cursor: pointer;
      transition: all 0.3s;
    }

    .class-option:hover {
      border-color: #6a6a8a;
      transform: translateY(-2px);
    }

    .class-option.selected {
      border-color: #ffd700;
      background: #3a3a5a;
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
    }

    .class-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .class-name {
      font-weight: bold;
      font-size: 1.1rem;
      color: #fff;
      margin-bottom: 0.25rem;
    }

    .class-desc {
      font-size: 0.85rem;
      text-align: center;
      color: #a0a0a0;
    }

    .create-btn {
      width: 100%;
      padding: 1rem 2rem;
      margin-top: 2rem;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
      color: #1a1a2e;
      font-size: 1.2rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
    }

    .create-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    }

    .create-btn:disabled {
      background: #4a4a6a;
      color: #8a8a8a;
      cursor: not-allowed;
    }
  `]
})
export class CharacterCreationComponent {
  characterName = '';
  selectedClass: CharacterClass | null = null;

  classes = [
    {
      type: CharacterClass.WARRIOR,
      name: 'Warrior',
      icon: '⚔️',
      description: 'Strong and durable fighter with high health'
    },
    {
      type: CharacterClass.MAGE,
      name: 'Mage',
      icon: '🔮',
      description: 'Powerful spellcaster with magical abilities'
    },
    {
      type: CharacterClass.ROGUE,
      name: 'Rogue',
      icon: '🗡️',
      description: 'Swift and deadly with high damage'
    },
    {
      type: CharacterClass.HEALER,
      name: 'Healer',
      icon: '✨',
      description: 'Support class that can heal wounds'
    }
  ];

  constructor(private characterService: CharacterService) {}

  selectClass(charClass: CharacterClass): void {
    this.selectedClass = charClass;
  }

  canCreate(): boolean {
    return this.characterName.trim().length > 0 && this.selectedClass !== null;
  }

  createCharacter(): void {
    if (!this.canCreate() || !this.selectedClass) return;
    
    this.characterService.createCharacter(
      this.characterName.trim(),
      this.selectedClass
    );

    // Reset form
    this.characterName = '';
    this.selectedClass = null;
  }
}
