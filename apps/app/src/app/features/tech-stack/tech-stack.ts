// src/app/features/tech-stack/tech-stack.ts
import { Component, OnInit, Inject, ChangeDetectionStrategy, signal } from '@angular/core'; // 1. Imports
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { CtaComponent } from '@shared/components/cta/cta';
import { LogoCard } from '@shared/components/logo-card/logo-card';
import { DataService, TechCategory } from '@core/services/data.service';
import { Observable } from 'rxjs'; // 2. No necesitamos 'Observable' aquí ahora

@Component({
  selector: 'jsl-tech-stack',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    LucideAngularModule, // 3. Añadir Lucide
    AnimateOnScroll,
    CtaComponent,
    LogoCard 
  ],
  templateUrl: './tech-stack.html',
  styleUrl: './tech-stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // 4. Añadir OnPush
})
export class TechStack implements OnInit {
  
  // 5. Usar Signals para el estado
  public categories = signal<TechCategory[]>([]);
  public selectedCategory = signal<TechCategory | null>(null);

  constructor(private dataService: DataService) {}

  ngOnInit() {
    // 6. Cargar los datos y establecer los signals
    this.dataService.getTechStack().subscribe(categories => {
      this.categories.set(categories);
      // Seleccionar la primera categoría por defecto
      if (categories.length > 0) {
        this.selectedCategory.set(categories[0]);
      }
    });
  }

  // 7. Método para cambiar la pestaña activa
  selectCategory(category: TechCategory): void {
    this.selectedCategory.set(category);
  }
}