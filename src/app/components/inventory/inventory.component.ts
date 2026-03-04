import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService } from '../../services/character.service';
import { Item, ItemType, ItemRarity } from '../../models/item.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inventory-container">
      <h2>🎒 Inventory</h2>

      @if (character(); as char) {
        <!-- Equipment Section -->
        <div class="equipment-section">
          <h3>Equipment</h3>
          <div class="equipment-slots">
            <div class="slot" [class.filled]="char.equipment.weapon">
              <span class="slot-label">Weapon</span>
              @if (char.equipment.weapon) {
                <div class="item" [class]="char.equipment.weapon.rarity.toLowerCase()">
                  ⚔️ {{ char.equipment.weapon.name }}
                  <span class="stat">+{{ char.equipment.weapon.damage }} DMG</span>
                </div>
              } @else {
                <div class="empty">Empty</div>
              }
            </div>

            <div class="slot" [class.filled]="char.equipment.head">
              <span class="slot-label">Head</span>
              @if (char.equipment.head) {
                <div class="item" [class]="char.equipment.head.rarity.toLowerCase()">
                  🪖 {{ char.equipment.head.name }}
                  <span class="stat">+{{ char.equipment.head.defense }} DEF</span>
                </div>
              } @else {
                <div class="empty">Empty</div>
              }
            </div>

            <div class="slot" [class.filled]="char.equipment.chest">
              <span class="slot-label">Chest</span>
              @if (char.equipment.chest) {
                <div class="item" [class]="char.equipment.chest.rarity.toLowerCase()">
                  🦺 {{ char.equipment.chest.name }}
                  <span class="stat">+{{ char.equipment.chest.defense }} DEF</span>
                </div>
              } @else {
                <div class="empty">Empty</div>
              }
            </div>

            <div class="slot" [class.filled]="char.equipment.legs">
              <span class="slot-label">Legs</span>
              @if (char.equipment.legs) {
                <div class="item" [class]="char.equipment.legs.rarity.toLowerCase()">
                  👖 {{ char.equipment.legs.name }}
                  <span class="stat">+{{ char.equipment.legs.defense }} DEF</span>
                </div>
              } @else {
                <div class="empty">Empty</div>
              }
            </div>

            <div class="slot" [class.filled]="char.equipment.feet">
              <span class="slot-label">Feet</span>
              @if (char.equipment.feet) {
                <div class="item" [class]="char.equipment.feet.rarity.toLowerCase()">
                  👢 {{ char.equipment.feet.name }}
                  <span class="stat">+{{ char.equipment.feet.defense }} DEF</span>
                </div>
              } @else {
                <div class="empty">Empty</div>
              }
            </div>

            <div class="slot" [class.filled]="char.equipment.trinket">
              <span class="slot-label">Trinket</span>
              @if (char.equipment.trinket) {
                <div class="item" [class]="char.equipment.trinket.rarity.toLowerCase()">
                  💎 {{ char.equipment.trinket.name }}
                </div>
              } @else {
                <div class="empty">Empty</div>
              }
            </div>
          </div>
        </div>

        <!-- Inventory Items -->
        <div class="items-section">
          <h3>Items ({{ char.inventory.items.length }}/{{ char.inventory.maxSize }})</h3>
          
          @if (char.inventory.items.length === 0) {
            <p class="empty-inventory">Your inventory is empty</p>
          } @else {
            <div class="items-grid">
              @for (item of char.inventory.items; track item.id) {
                <div
                  class="inventory-item"
                  [class]="item.rarity.toLowerCase()"
                  (click)="selectItem(item)"
                  [class.selected]="selectedItem?.id === item.id"
                >
                  <span class="item-icon">{{ getItemIcon(item) }}</span>
                  <span class="item-name">{{ item.name }}</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Selected Item Details -->
        @if (selectedItem) {
          <div class="item-details">
            <h4 [class]="selectedItem.rarity.toLowerCase()">{{ selectedItem.name }}</h4>
            <p class="item-type">{{ selectedItem.type }} - {{ selectedItem.rarity }}</p>
            <p class="item-desc">{{ selectedItem.description }}</p>
            <p class="item-value">💰 Value: {{ selectedItem.value }} gold</p>
            
            <div class="item-actions">
              @if (canEquip(selectedItem)) {
                <button class="equip-btn" (click)="equipItem()">
                  Equip
                </button>
              }
              @if (isConsumable(selectedItem)) {
                <button class="use-btn" (click)="useItem()">
                  Use
                </button>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .inventory-container {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 1.5rem;
    }

    h2 {
      color: #ffd700;
      margin: 0 0 1.5rem 0;
      text-align: center;
    }

    h3 {
      color: #e0e0e0;
      margin: 0 0 1rem 0;
      font-size: 1rem;
    }

    .equipment-section {
      margin-bottom: 2rem;
    }

    .equipment-slots {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .slot {
      background: #2a2a4a;
      border-radius: 8px;
      padding: 0.75rem;
      border: 2px solid #3a3a5a;
    }

    .slot.filled {
      border-color: #4a4a6a;
    }

    .slot-label {
      display: block;
      color: #8a8a8a;
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .item {
      color: #fff;
      font-size: 0.85rem;
    }

    .item .stat {
      display: block;
      color: #27ae60;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .empty {
      color: #5a5a7a;
      font-style: italic;
      font-size: 0.85rem;
    }

    .items-section {
      margin-bottom: 1.5rem;
    }

    .empty-inventory {
      text-align: center;
      color: #8a8a8a;
      padding: 2rem;
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }

    .inventory-item {
      aspect-ratio: 1;
      background: #2a2a4a;
      border: 2px solid #3a3a5a;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      padding: 0.5rem;
    }

    .inventory-item:hover {
      transform: translateY(-2px);
      border-color: #6a6a8a;
    }

    .inventory-item.selected {
      border-color: #ffd700;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
    }

    .item-icon {
      font-size: 1.5rem;
    }

    .item-name {
      font-size: 0.65rem;
      color: #a0a0a0;
      text-align: center;
      margin-top: 0.25rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
    }

    /* Rarity colors */
    .common { border-color: #9a9a9a; }
    .common .item-name, .common h4 { color: #9a9a9a; }
    
    .uncommon { border-color: #1eff00; }
    .uncommon .item-name, .uncommon h4 { color: #1eff00; }
    
    .rare { border-color: #0070dd; }
    .rare .item-name, .rare h4 { color: #0070dd; }
    
    .epic { border-color: #a335ee; }
    .epic .item-name, .epic h4 { color: #a335ee; }
    
    .legendary { border-color: #ff8000; }
    .legendary .item-name, .legendary h4 { color: #ff8000; }

    .item-details {
      background: #2a2a4a;
      border-radius: 8px;
      padding: 1rem;
    }

    .item-details h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
    }

    .item-type {
      color: #8a8a8a;
      font-size: 0.85rem;
      margin: 0 0 0.5rem 0;
    }

    .item-desc {
      color: #a0a0a0;
      font-size: 0.9rem;
      margin: 0 0 0.5rem 0;
    }

    .item-value {
      color: #ffd700;
      font-size: 0.9rem;
      margin: 0 0 1rem 0;
    }

    .item-actions {
      display: flex;
      gap: 0.5rem;
    }

    .equip-btn, .use-btn {
      flex: 1;
      padding: 0.75rem;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }

    .equip-btn {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
    }

    .use-btn {
      background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
      color: white;
    }

    .equip-btn:hover, .use-btn:hover {
      transform: translateY(-2px);
    }
  `]
})
export class InventoryComponent {
  private characterService = inject(CharacterService);
  
  character = this.characterService.activeCharacter;
  selectedItem: Item | null = null;

  selectItem(item: Item): void {
    this.selectedItem = this.selectedItem?.id === item.id ? null : item;
  }

  getItemIcon(item: Item): string {
    switch (item.type) {
      case ItemType.WEAPON: return '⚔️';
      case ItemType.ARMOR: return '🛡️';
      case ItemType.CONSUMABLE: return '🧪';
      case ItemType.TRINKET: return '💎';
      default: return '📦';
    }
  }

  canEquip(item: Item): boolean {
    return item.type === ItemType.WEAPON ||
           item.type === ItemType.ARMOR ||
           item.type === ItemType.TRINKET;
  }

  isConsumable(item: Item): boolean {
    return item.type === ItemType.CONSUMABLE;
  }

  equipItem(): void {
    const char = this.character();
    if (!char || !this.selectedItem) return;

    this.characterService.equipItem(char.id, this.selectedItem.id);
    this.selectedItem = null;
  }

  useItem(): void {
    const char = this.character();
    if (!char || !this.selectedItem || this.selectedItem.type !== ItemType.CONSUMABLE) return;

    // Get heal amount from consumable
    const consumable = this.selectedItem as { healAmount?: number };
    if (consumable.healAmount) {
      this.characterService.healCharacter(char.id, consumable.healAmount);
    }

    // Remove item from inventory after use
    this.characterService.removeItemFromInventory(char.id, this.selectedItem.id);
    this.selectedItem = null;
  }
}
