import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jsl-logo-card',
  standalone: true,
  imports: [
    CommonModule, 
    TranslateModule, 
    NgOptimizedImage
  ],
  templateUrl: './logo-card.html',
  styleUrl: './logo-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoCard {
  @Input() imageUrl = '';
  @Input() name = 'Technology Logo';
  
  @Input() nameKey: string | null = null;
}