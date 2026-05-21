import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { LanguageSwitcher } from '../language-switcher/language-switcher'; // Importamos el selector de idioma

@Component({
  selector: 'jsl-top-bar',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    LanguageSwitcher // Lo añadimos aquí
  ],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss'
})
export class TopBar {
  public currentLang: string;

  // --- ELIMINADO: 'topLinks' ya no se gestiona aquí ---

  constructor(private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    
    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
    });
  }
}