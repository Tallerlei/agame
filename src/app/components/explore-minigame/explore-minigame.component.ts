import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GridCell {
  row: number;
  col: number;
  revealed: boolean;
  type: 'empty' | 'player' | 'target' | 'obstacle' | 'treasure';
}

@Component({
  selector: 'app-explore-minigame',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="explore-container">
      <div class="explore-header">
        <h3>🧭 Exploration</h3>
        <p class="location-name">📍 {{ locationName }}</p>
        <p class="hint">Find the objective! Use the arrows or click adjacent tiles to move.</p>
        <div class="steps-counter">Steps: {{ steps }}</div>
      </div>

      <div class="grid" [style.grid-template-columns]="'repeat(' + gridSize + ', 1fr)'">
        @for (cell of grid; track cell.row * gridSize + cell.col) {
          <div
            class="cell"
            [class.revealed]="cell.revealed"
            [class.player]="cell.row === playerRow && cell.col === playerCol"
            [class.target]="cell.revealed && cell.type === 'target'"
            [class.obstacle]="cell.revealed && cell.type === 'obstacle'"
            [class.treasure]="cell.revealed && cell.type === 'treasure'"
            [class.adjacent]="isAdjacent(cell)"
            (click)="onCellClick(cell)"
          >
            @if (cell.row === playerRow && cell.col === playerCol) {
              <span>🧙</span>
            } @else if (cell.revealed && cell.type === 'target') {
              <span>⭐</span>
            } @else if (cell.revealed && cell.type === 'obstacle') {
              <span>🪨</span>
            } @else if (cell.revealed && cell.type === 'treasure') {
              <span>💎</span>
            } @else if (cell.revealed) {
              <span class="fog-cleared"></span>
            } @else {
              <span class="fog">?</span>
            }
          </div>
        }
      </div>

      <div class="controls">
        <div class="arrow-row">
          <button class="arrow-btn" (click)="move(-1, 0)">⬆️</button>
        </div>
        <div class="arrow-row">
          <button class="arrow-btn" (click)="move(0, -1)">⬅️</button>
          <button class="arrow-btn" (click)="move(1, 0)">⬇️</button>
          <button class="arrow-btn" (click)="move(0, 1)">➡️</button>
        </div>
      </div>

      <button class="cancel-btn" (click)="cancel.emit()">Cancel</button>
    </div>
  `,
  styles: [`
    .explore-container { background: linear-gradient(135deg, #0d1b2a, #1b2838); border: 2px solid #3498db; border-radius: 12px; padding: 1.5rem; text-align: center; }
    .explore-header h3 { color: #3498db; margin: 0 0 0.25rem; }
    .location-name { color: #ffd700; font-weight: bold; margin: 0 0 0.25rem; font-size: 1rem; }
    .hint { color: #a0a0a0; font-size: 0.8rem; margin: 0 0 0.5rem; }
    .steps-counter { color: #e0e0e0; font-size: 0.85rem; margin-bottom: 0.75rem; }
    .grid { display: grid; gap: 2px; max-width: 320px; margin: 0 auto 1rem; }
    .cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: #1a1a2e; border-radius: 4px; font-size: 1.2rem; cursor: default; transition: background 0.2s; border: 1px solid #2a2a4a; }
    .cell.revealed { background: #2a2a4a; }
    .cell.player { background: #2d4a2d; border-color: #27ae60; }
    .cell.target { background: #4a4a1a; border-color: #ffd700; animation: pulse 1s infinite; }
    .cell.obstacle { background: #3a2a2a; }
    .cell.treasure { background: #2a2a4a; border-color: #a335ee; }
    .cell.adjacent { cursor: pointer; border-color: #4a6a8a; }
    .cell.adjacent:hover { background: #3a4a5a; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 5px rgba(255,215,0,0.3); } 50% { box-shadow: 0 0 15px rgba(255,215,0,0.6); } }
    .fog { color: #4a4a6a; font-size: 0.8rem; }
    .fog-cleared { display: block; width: 4px; height: 4px; background: #3a3a5a; border-radius: 50%; }
    .controls { margin-bottom: 0.75rem; }
    .arrow-row { display: flex; justify-content: center; gap: 0.25rem; margin: 2px 0; }
    .arrow-btn { width: 44px; height: 44px; border: none; border-radius: 8px; background: #2a2a4a; font-size: 1.2rem; cursor: pointer; transition: background 0.2s; }
    .arrow-btn:hover { background: #3a4a5a; }
    .cancel-btn { padding: 0.5rem 1.5rem; border: none; border-radius: 6px; background: #4a4a6a; color: #a0a0a0; cursor: pointer; transition: all 0.2s; }
    .cancel-btn:hover { background: #e74c3c; color: white; }
  `]
})
export class ExploreMinigameComponent implements OnInit {
  @Input() locationName = 'Unknown Location';
  @Input() gridSize = 6;
  @Output() completed = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  grid: GridCell[] = [];
  playerRow = 0;
  playerCol = 0;
  targetRow = 0;
  targetCol = 0;
  steps = 0;

  ngOnInit(): void {
    this.generateGrid();
  }

  private generateGrid(): void {
    this.grid = [];
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        this.grid.push({ row, col, revealed: false, type: 'empty' });
      }
    }

    // Place player at random position
    this.playerRow = Math.floor(Math.random() * this.gridSize);
    this.playerCol = Math.floor(Math.random() * this.gridSize);
    this.getCell(this.playerRow, this.playerCol).revealed = true;

    // Place target far from player
    do {
      this.targetRow = Math.floor(Math.random() * this.gridSize);
      this.targetCol = Math.floor(Math.random() * this.gridSize);
    } while (
      Math.abs(this.targetRow - this.playerRow) + Math.abs(this.targetCol - this.playerCol) < Math.floor(this.gridSize / 2)
    );
    this.getCell(this.targetRow, this.targetCol).type = 'target';

    // Place obstacles (15% of remaining cells)
    const obstacleCount = Math.floor(this.gridSize * this.gridSize * 0.15);
    let placed = 0;
    while (placed < obstacleCount) {
      const r = Math.floor(Math.random() * this.gridSize);
      const c = Math.floor(Math.random() * this.gridSize);
      const cell = this.getCell(r, c);
      if (cell.type === 'empty' && !(r === this.playerRow && c === this.playerCol)) {
        cell.type = 'obstacle';
        placed++;
      }
    }

    // Reveal cells around player
    this.revealAround(this.playerRow, this.playerCol);
  }

  private getCell(row: number, col: number): GridCell {
    return this.grid[row * this.gridSize + col];
  }

  private revealAround(row: number, col: number): void {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
          this.getCell(nr, nc).revealed = true;
        }
      }
    }
  }

  isAdjacent(cell: GridCell): boolean {
    const dr = Math.abs(cell.row - this.playerRow);
    const dc = Math.abs(cell.col - this.playerCol);
    return (dr + dc === 1) && cell.type !== 'obstacle';
  }

  onCellClick(cell: GridCell): void {
    if (this.isAdjacent(cell)) {
      this.moveTo(cell.row, cell.col);
    }
  }

  move(dRow: number, dCol: number): void {
    const newRow = this.playerRow + dRow;
    const newCol = this.playerCol + dCol;
    if (newRow < 0 || newRow >= this.gridSize || newCol < 0 || newCol >= this.gridSize) return;
    const cell = this.getCell(newRow, newCol);
    if (cell.type === 'obstacle') return;
    this.moveTo(newRow, newCol);
  }

  private moveTo(row: number, col: number): void {
    this.playerRow = row;
    this.playerCol = col;
    this.steps++;
    this.revealAround(row, col);

    if (row === this.targetRow && col === this.targetCol) {
      this.completed.emit();
    }
  }
}
