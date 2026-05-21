import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface TimelineItem {
  date: string;
  titleKey: string;
  descKey: string;
  status: 'completed' | 'current' | 'planned';
}

@Component({
  selector: 'jsl-timeline',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss'
})
export class TimelineComponent {
  @Input() items: TimelineItem[] = [];
}
