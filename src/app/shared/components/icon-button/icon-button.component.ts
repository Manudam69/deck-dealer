import { Component, input, output } from '@angular/core';
import { IconComponent, type IconName } from '../icon/icon.component';

@Component({
  selector: 'app-icon-button',
  imports: [IconComponent],
  templateUrl: './icon-button.component.html',
})
export class IconButtonComponent {
  readonly icon = input.required<IconName>();
  readonly label = input.required<string>();
  readonly size = input(24);
  readonly clicked = output<void>();
}
