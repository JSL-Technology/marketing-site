import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageSuggestionService } from '@core/services/language-suggestion.service';
import { TranslateModule } from '@ngx-translate/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'jsl-language-suggestion',
  standalone: true,
  imports: [CommonModule, TranslateModule, LucideAngularModule],
  templateUrl: './language-suggestion.html',
  styleUrl: './language-suggestion.scss',
  animations: [
    trigger('fadeScale', [
      transition(':enter', [
        style({ transform: 'scale(0.94) translateY(8px)', opacity: 0 }),
        animate('350ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'scale(1) translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'scale(0.94) translateY(8px)', opacity: 0 }))
      ])
    ])
  ]
})
export class LanguageSuggestionComponent {
  protected suggestionService = inject(LanguageSuggestionService);
  suggestion$ = this.suggestionService.suggestion$;

  onSwitch(code: string) {
    this.suggestionService.switchToPreferred(code);
  }

  onDismiss() {
    this.suggestionService.dismiss();
  }
}
