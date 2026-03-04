import { Component } from '@angular/core';
import { GameComponent } from './components/game/game.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameComponent],
  template: `<app-game></app-game>`,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AppComponent {
  title = 'Epic Adventure';
}
