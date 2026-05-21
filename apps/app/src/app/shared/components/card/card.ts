import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jsl-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, TranslateModule],
  templateUrl: './card.html',
  styleUrl: './card.scss'
})
export class Card {
  @Input() icon: string | null = 'Settings';
  @Input() imageUrl: string | null = null;
  @Input() title = 'Card Title';
  @Input() description = 'Card description goes here.';

  @Input() link: any[] | string | null = null;
  @Input() externalLink: string | null | undefined = null;
  @Input() metrics: string[] = [];
  @Input() meta: {
    date?: string;
    readTime?: number;
    tags?: string[];
  } | null = null;
}