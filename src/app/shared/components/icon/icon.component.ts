import { Component, computed, input } from '@angular/core';

export type IconName =
  | 'play'
  | 'pause'
  | 'skip-forward'
  | 'shuffle'
  | 'settings'
  | 'volume'
  | 'x';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  host: {
    class: 'inline-flex items-center justify-center',
  },
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(24);

  private readonly paths: Record<IconName, string> = {
    play: 'M5 3l14 9-14 9V3z',
    pause: 'M6 4h4v16H6V4zm8 0h4v16h-4V4z',
    'skip-forward': 'M5 4l10 8-10 8V4zm14 1v14',
    shuffle: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M3 4l7 7',
    settings:
      'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09c0 .67.34 1.32 1 1.51a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c0 .67.34 1.32 1 1.51h.09a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
    volume:
      'M11 5L6 9H2v6h4l5 4V5z M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07',
    x: 'M18 6L6 18M6 6l12 12',
  };

  readonly path = computed(() => this.paths[this.name()]);
}
