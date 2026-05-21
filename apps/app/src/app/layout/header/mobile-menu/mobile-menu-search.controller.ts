import { Injectable, signal, computed } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  MobileMenuSectionData,
  MobileMenuLink,
  SEARCH_MAX_AUTO_EXPANDED_SECTIONS,
} from './mobile-menu.constants';

// Tamaño máximo del caché de traducciones. Con 11 idiomas × ~45 claves = ~495
// entradas máximas posibles; 200 evita que el Map crezca sin límite mientras
// mantiene una cobertura de caché razonable.
const TRANSLATION_CACHE_MAX_SIZE = 200;

@Injectable()
export class MobileMenuSearchController {
  public searchQuery       = signal('');
  public expandedSections  = signal<Set<string>>(new Set());
  private expandedSectionsBeforeSearch: Set<string> | null = null;
  private translationCache = new Map<string, string>();
  private menuSections: MobileMenuSectionData[] = [];

  public searchResultsCount = computed(() => {
    const query = this.searchQuery();
    if (!query) return 0;

    let count = 0;
    for (const section of this.menuSections) {
      section.links.forEach(link => {
        if (this.shouldShowLink(link.key)) count++;
      });
    }
    if (this.shouldShowLink('HEADER.CONTACT')) count++;
    return count;
  });

  constructor(private translate: TranslateService) {}

  public setMenuSections(sections: MobileMenuSectionData[]) {
    this.menuSections = sections;
    this.translationCache.clear();
  }

  public onSearchChange(query: string) {
    const hadQuery = !!this.searchQuery();
    this.searchQuery.set(query);

    if (query) {
      if (!hadQuery) {
        this.expandedSectionsBeforeSearch = new Set(this.expandedSections());
        this.expandedSections.set(new Set());
      }

      const newExpanded   = new Set<string>();
      let expandedCount   = 0;
      for (const section of this.menuSections) {
        if (
          this.shouldShowSection(section.titleKey, section.links) &&
          expandedCount < SEARCH_MAX_AUTO_EXPANDED_SECTIONS
        ) {
          newExpanded.add(section.id);
          expandedCount++;
        }
      }
      this.expandedSections.set(newExpanded);
    } else if (hadQuery) {
      this.expandedSections.set(this.expandedSectionsBeforeSearch ?? new Set<string>());
      this.expandedSectionsBeforeSearch = null;
    }
  }

  public toggleSection(sectionId: string) {
    const current = new Set(this.expandedSections());
    if (current.has(sectionId)) {
      current.delete(sectionId);
    } else {
      current.add(sectionId);
    }
    this.expandedSections.set(current);
  }

  public isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections().has(sectionId);
  }

  private getTranslatedLowercase(key: string): string {
    const lang     = this.translate.currentLang ?? this.translate.defaultLang ?? 'es';
    const cacheKey = `${lang}:${key}`;
    const cached   = this.translationCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const translated = this.translate.instant(key).toLowerCase();

    // Evicción FIFO cuando se supera el tamaño máximo: el Map mantiene orden de
    // inserción, así que el primer elemento es el más antiguo.
    if (this.translationCache.size >= TRANSLATION_CACHE_MAX_SIZE) {
      const firstKey = this.translationCache.keys().next().value;
      if (firstKey !== undefined) {
        this.translationCache.delete(firstKey);
      }
    }
    this.translationCache.set(cacheKey, translated);
    return translated;
  }

  public shouldShowLink = (linkTextKey: string): boolean => {
    const query = this.searchQuery();
    if (!query) return true;
    return this.getTranslatedLowercase(linkTextKey).includes(query.toLowerCase());
  };

  public shouldShowSection(sectionKey: string, links: MobileMenuLink[]): boolean {
    const query = this.searchQuery();
    if (!query) return true;
    if (this.getTranslatedLowercase(sectionKey).includes(query.toLowerCase())) return true;
    return links.some(link => this.shouldShowLink(link.key));
  }

  public clearSearch() {
    this.onSearchChange('');
  }
}
