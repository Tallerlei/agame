import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService } from '../../services/character.service';
import { Item, ItemType, ItemRarity, Weapon, Armor, Consumable, Trinket, Bag } from '../../models/item.model';
import { calculateEncumbrance, canEquipItem } from '../../models/character.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inventory-container">
      <h2>🎒 Inventory</h2>

      @if (character(); as char) {
        <!-- Encumbrance Bar -->
        @let enc = getEncumbrance(char);
        <div class="encumbrance-section">
          <div class="enc-header">
            <span class="enc-label">⚖️ Burden: {{ char.inventory.items.length }} / {{ char.stats.strength }}</span>
            <span class="enc-status" [class.enc-ok]="enc <= 0.5" [class.enc-warn]="enc > 0.5 && enc <= 0.75" [class.enc-heavy]="enc > 0.75">
              {{ enc <= 0.5 ? 'Normal' : enc <= 0.75 ? 'Encumbered' : 'Heavily Encumbered' }}
            </span>
          </div>
          <div class="enc-bar-bg">
            <div class="enc-bar-fill"
              [style.width.%]="enc * 100"
              [class.enc-fill-ok]="enc <= 0.5"
              [class.enc-fill-warn]="enc > 0.5 && enc <= 0.75"
              [class.enc-fill-heavy]="enc > 0.75">
            </div>
          </div>
          @if (enc > 0.5) {
            <p class="enc-note">{{ enc > 0.75 ? '⚠️ Physical attacks -' + getAttackPenaltyPct(enc) + '% & movement slowed' : '🔶 Physical attacks -' + getAttackPenaltyPct(enc) + '%' }}</p>
          }
        </div>

        <!-- Equipment Section -->
        <div class="equipment-section">
          <h3>Equipment</h3>
          <div class="equipment-slots">
            <div class="slot" [class.filled]="char.equipment.weapon">
              <span class="slot-label">Weapon</span>
              @if (char.equipment.weapon) {
                <div class="item" [class]="char.equipment.weapon.rarity.toLowerCase()">
                  ⚔️ {{ char.equipment.weapon.name }}
                  <span class="stat">+{{ char.equipment.weapon.damage }} DMG | {{ char.equipment.weapon.attackSpeed | number:'1.1-1' }}x SPD</span>
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
                  <span class="stat">{{ getTrinketStatLine(char.equipment.trinket) }}</span>
                </div>
              } @else {
                <div class="empty">Empty</div>
              }
            </div>

            <div class="slot" [class.filled]="char.equipment.bag">
              <span class="slot-label">Bag</span>
              @if (char.equipment.bag) {
                <div class="item" [class]="char.equipment.bag.rarity.toLowerCase()">
                  🎒 {{ char.equipment.bag.name }}
                  <span class="stat">+{{ char.equipment.bag.slotsGranted }} slots</span>
                </div>
              } @else {
                <div class="empty">Empty</div>
              }
            </div>
          </div>
        </div>

        <!-- Inventory Items -->
        <div class="items-section">
          <div class="items-header">
            <h3>Items ({{ char.inventory.items.length }}/{{ char.inventory.maxSize }})</h3>
            <button
              class="filter-btn"
              [class.active]="filterCompatibleOnly"
              (click)="filterCompatibleOnly = !filterCompatibleOnly"
              title="Show only items your class can equip"
            >🔍 Klassenkompatibel</button>
          </div>
          
          @if (char.inventory.items.length === 0) {
            <p class="empty-inventory">Your inventory is empty</p>
          } @else {
            <div class="items-grid">
              @for (item of getFilteredItems(char); track item.id) {
                <div
                  class="inventory-item"
                  [class]="item.rarity.toLowerCase()"
                  (click)="selectItem(item)"
                  [class.selected]="selectedItem?.id === item.id"
                  [class.restricted]="isRestricted(char, item)"
                >
                  <span class="item-icon">{{ getItemIcon(item) }}</span>
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-stat-line">{{ getItemStatLine(item) }}</span>
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
            @if (getClassRestrictionLabel(selectedItem); as label) {
              <p class="item-restriction">🔒 {{ label }}</p>
            }
            <div class="item-stats-block">
              {{ getItemFullStats(selectedItem) }}
            </div>
            <p class="item-value">💰 Value: {{ selectedItem.value }} gold</p>
            
            @if (equipError) {
              <p class="equip-error">⚠️ {{ equipError }}</p>
            }

            <div class="item-actions">
              @if (canEquip(char, selectedItem)) {
                <button class="equip-btn" (click)="equipItem()">
                  Equip
                </button>
              }
              @if (isConsumable(selectedItem)) {
                <button class="use-btn" (click)="useItem()">
                  Use
                </button>
              }
              <button class="drop-btn" (click)="dropItem()">
                🗑️ Drop
              </button>
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

    .encumbrance-section {
      background: #2a2a4a;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .enc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }

    .enc-label { color: #e0e0e0; font-size: 0.85rem; }
    .enc-status { font-size: 0.75rem; font-weight: bold; padding: 0.1rem 0.5rem; border-radius: 8px; }
    .enc-ok { color: #27ae60; }
    .enc-warn { color: #f39c12; }
    .enc-heavy { color: #e74c3c; }

    .enc-bar-bg {
      background: #1a1a2e;
      border-radius: 4px;
      height: 6px;
      overflow: hidden;
    }

    .enc-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;
    }

    .enc-fill-ok { background: #27ae60; }
    .enc-fill-warn { background: #f39c12; }
    .enc-fill-heavy { background: #e74c3c; }

    .enc-note { color: #a0a0a0; font-size: 0.75rem; margin: 0.3rem 0 0; }

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

    .items-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .items-header h3 {
      margin: 0;
    }

    .filter-btn {
      background: #2a2a4a;
      border: 2px solid #3a3a5a;
      border-radius: 6px;
      color: #8a8a8a;
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0.3rem 0.6rem;
      transition: all 0.2s;
    }

    .filter-btn.active {
      border-color: #ffd700;
      color: #ffd700;
    }

    .inventory-item.restricted {
      opacity: 0.45;
      border-style: dashed;
    }

    .item-restriction {
      color: #e67e22;
      font-size: 0.8rem;
      margin: 0 0 0.5rem 0;
    }

    .equip-error {
      color: #e74c3c;
      font-size: 0.85rem;
      margin: 0 0 0.5rem 0;
      background: rgba(231, 76, 60, 0.12);
      border-radius: 4px;
      padding: 0.35rem 0.6rem;
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
      padding: 0.4rem;
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
      font-size: 1.3rem;
    }

    .item-name {
      font-size: 0.6rem;
      color: #a0a0a0;
      text-align: center;
      margin-top: 0.2rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
    }

    .item-stat-line {
      font-size: 0.6rem;
      color: #27ae60;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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

    .item-stats-block {
      color: #27ae60;
      font-size: 0.9rem;
      margin: 0 0 0.5rem 0;
      padding: 0.4rem 0.6rem;
      background: #1a1a2e;
      border-radius: 4px;
    }

    .item-value {
      color: #ffd700;
      font-size: 0.9rem;
      margin: 0.5rem 0 1rem 0;
    }

    .item-actions {
      display: flex;
      gap: 0.5rem;
    }

    .equip-btn, .use-btn, .drop-btn {
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

    .drop-btn {
      background: linear-gradient(135deg, #7f8c8d 0%, #5d6d7e 100%);
      color: white;
    }

    .equip-btn:hover, .use-btn:hover, .drop-btn:hover {
      transform: translateY(-2px);
    }

    .drop-btn:hover {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    }
  `]
})
export class InventoryComponent {
  private characterService = inject(CharacterService);
  
  character = this.characterService.activeCharacter;
  selectedItem: Item | null = null;
  filterCompatibleOnly = false;
  equipError: string | null = null;

  selectItem(item: Item): void {
    this.selectedItem = this.selectedItem?.id === item.id ? null : item;
    this.equipError = null;
  }

  getFilteredItems(char: { characterClass: string; inventory: { items: Item[] }; stats: { strength: number } }): Item[] {
    if (!this.filterCompatibleOnly) return char.inventory.items;
    return char.inventory.items.filter(item => {
      const character = this.character();
      if (!character) return true;
      return canEquipItem(character, item).canEquip;
    });
  }

  isRestricted(char: { characterClass: string; stats: { strength: number }; inventory: { items: Item[] } }, item: Item): boolean {
    const character = this.character();
    if (!character) return false;
    if (item.type !== ItemType.WEAPON && item.type !== ItemType.ARMOR) return false;
    return !canEquipItem(character, item).canEquip;
  }

  getClassRestrictionLabel(item: Item): string | null {
    if (item.type === ItemType.WEAPON) {
      const w = item as Weapon;
      if (w.classRestriction && w.classRestriction.length > 0) {
        return w.classRestriction.map(c => c.charAt(0) + c.slice(1).toLowerCase()).join(', ');
      }
      return null;
    }
    if (item.type === ItemType.ARMOR) {
      const a = item as Armor;
      if (a.classRestriction && a.classRestriction.length > 0) {
        return a.classRestriction.map(c => c.charAt(0) + c.slice(1).toLowerCase()).join(', ');
      }
      return null;
    }
    return null;
  }

  getItemIcon(item: Item): string {
    switch (item.type) {
      case ItemType.WEAPON: return '⚔️';
      case ItemType.ARMOR: return '🛡️';
      case ItemType.CONSUMABLE: return '🧪';
      case ItemType.TRINKET: return '💎';
      case ItemType.BAG: return '🎒';
      default: return '📦';
    }
  }

  canEquip(char: { characterClass: string; stats: { strength: number }; inventory: { items: Item[] } } | null, item: Item): boolean {
    if (!char) return false;
    if (item.type !== ItemType.WEAPON &&
        item.type !== ItemType.ARMOR &&
        item.type !== ItemType.TRINKET &&
        item.type !== ItemType.BAG) {
      return false;
    }
    const character = this.character();
    if (!character) return false;
    return canEquipItem(character, item).canEquip;
  }

  isConsumable(item: Item): boolean {
    return item.type === ItemType.CONSUMABLE;
  }

  equipItem(): void {
    const char = this.character();
    if (!char || !this.selectedItem) return;

    const result = this.characterService.equipItem(char.id, this.selectedItem.id);
    if (result.success) {
      this.selectedItem = null;
      this.equipError = null;
    } else {
      this.equipError = result.reason ?? 'Dieses Item kann nicht ausgerüstet werden.';
    }
  }

  useItem(): void {
    const char = this.character();
    if (!char || !this.selectedItem || this.selectedItem.type !== ItemType.CONSUMABLE) return;

    const consumable = this.selectedItem as Consumable;
    if (consumable.healAmount) {
      this.characterService.healCharacter(char.id, consumable.healAmount);
    }

    this.characterService.removeItemFromInventory(char.id, this.selectedItem.id);
    this.selectedItem = null;
    this.equipError = null;
  }

  dropItem(): void {
    const char = this.character();
    if (!char || !this.selectedItem) return;

    this.characterService.removeItemFromInventory(char.id, this.selectedItem.id);
    this.selectedItem = null;
    this.equipError = null;
  }

  getEncumbrance(char: { inventory: { items: unknown[] }; stats: { strength: number } }): number {
    return calculateEncumbrance(char.inventory.items.length, char.stats.strength);
  }

  getAttackPenaltyPct(enc: number): number {
    return Math.round(Math.max(0, enc - 0.5) * 0.5 * 100);
  }

  getItemStatLine(item: Item): string {
    switch (item.type) {
      case ItemType.WEAPON: {
        const w = item as Weapon;
        return `+${w.damage} DMG`;
      }
      case ItemType.ARMOR: {
        const a = item as Armor;
        return `+${a.defense} DEF`;
      }
      case ItemType.CONSUMABLE: {
        const c = item as Consumable;
        return c.healAmount ? `+${c.healAmount} HP` : '';
      }
      case ItemType.TRINKET: {
        const t = item as Trinket;
        const bonus = t.statBonus;
        const parts: string[] = [];
        if (bonus.strength) parts.push(`+${bonus.strength} STR`);
        if (bonus.agility) parts.push(`+${bonus.agility} AGI`);
        if (bonus.intelligence) parts.push(`+${bonus.intelligence} INT`);
        if (bonus.health) parts.push(`+${bonus.health} HP`);
        return parts.join(' ');
      }
      case ItemType.BAG: {
        const b = item as Bag;
        return `+${b.slotsGranted} slots`;
      }
      default: return '';
    }
  }

  getItemFullStats(item: Item): string {
    switch (item.type) {
      case ItemType.WEAPON: {
        const w = item as Weapon;
        const parts = [`⚔️ Damage: ${w.damage}`, `⚡ Speed: ${w.attackSpeed.toFixed(1)}x`, `🗡️ Type: ${w.weaponType}`];
        if (w.statBonus) {
          const sb = w.statBonus;
          if (sb.strength)     parts.push(`💪 STR +${sb.strength}`);
          if (sb.agility)      parts.push(`🏃 AGI +${sb.agility}`);
          if (sb.intelligence) parts.push(`🧠 INT +${sb.intelligence}`);
        }
        return parts.join('  ');
      }
      case ItemType.ARMOR: {
        const a = item as Armor;
        return `🛡️ Defense: ${a.defense}  📍 Slot: ${a.slot}  🧲 Class: ${a.armorClass}`;
      }
      case ItemType.CONSUMABLE: {
        const c = item as Consumable;
        return c.healAmount ? `❤️ Heals: ${c.healAmount} HP` : 'No active stats';
      }
      case ItemType.TRINKET: {
        const t = item as Trinket;
        const bonus = t.statBonus;
        const parts: string[] = [];
        if (bonus.strength) parts.push(`💪 STR +${bonus.strength}`);
        if (bonus.agility) parts.push(`🏃 AGI +${bonus.agility}`);
        if (bonus.intelligence) parts.push(`🧠 INT +${bonus.intelligence}`);
        if (bonus.health) parts.push(`❤️ HP +${bonus.health}`);
        return parts.join('  ') || 'No stat bonuses';
      }
      case ItemType.BAG: {
        const b = item as Bag;
        return `🎒 Inventory slots: +${b.slotsGranted}`;
      }
      default: return '';
    }
  }

  getTrinketStatLine(trinket: Trinket): string {
    const bonus = trinket.statBonus;
    const parts: string[] = [];
    if (bonus.strength) parts.push(`+${bonus.strength} STR`);
    if (bonus.agility) parts.push(`+${bonus.agility} AGI`);
    if (bonus.intelligence) parts.push(`+${bonus.intelligence} INT`);
    if (bonus.health) parts.push(`+${bonus.health} HP`);
    return parts.join(' ') || 'No bonus';
  }
}
