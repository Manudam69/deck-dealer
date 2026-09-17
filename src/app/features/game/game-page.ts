import { Component, inject, signal } from '@angular/core';
import { CardHistoryComponent } from './components/card-history/card-history.component';
import { CurrentCardComponent } from './components/current-card/current-card.component';
import { EndBannerComponent } from './components/end-banner/end-banner.component';
import { GameControlsComponent } from './components/game-controls/game-controls.component';
import { SettingsSheetComponent } from './components/settings-sheet/settings-sheet.component';
import { GameService } from '../../core/services/game.service';

@Component({
  selector: 'app-game-page',
  imports: [
    CardHistoryComponent,
    CurrentCardComponent,
    GameControlsComponent,
    SettingsSheetComponent,
    EndBannerComponent,
  ],
  templateUrl: './game-page.html',
  host: {
    class: 'block h-dvh',
  },
})
export default class GamePage {
  protected readonly game = inject(GameService);
  readonly settingsOpen = signal(false);
}
