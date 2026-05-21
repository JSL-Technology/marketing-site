import { Component, EventEmitter, Output, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '@core/constants/icons';
import { DataService, BlogPost, Solution, Product, Project, StaticPage, Venture } from '@core/services/data.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, LucideAngularModule],
  templateUrl: './search-overlay.html',
  styleUrls: ['./search-overlay.scss']
})
export class SearchOverlayComponent {
  @Output() close = new EventEmitter<void>();
  @ViewChild('searchInput') searchInput!: ElementRef;

  query = '';
  results: { type: string; item: any }[] = [];
  activeFilter = 'all';

  readonly icons = ALL_ICONS;
  private searchSubject = new Subject<string>();

  constructor(private dataService: DataService) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(q => {
      this.performSearch(q);
    });
  }

  ngAfterViewInit() {
    this.searchInput.nativeElement.focus();
  }

  onSearchInput(q: string): void {
    this.searchSubject.next(q);
  }

  performSearch(q: string): void {
    if (!q) {
      this.results = [];
      return;
    }
    this.dataService.search(q).subscribe(res => {
      this.results = res;
    });
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
  }

  get filteredResults() {
    if (this.activeFilter === 'all') return this.results;
    return this.results.filter(r => r.type === this.activeFilter);
  }

  closeOverlay(): void {
    this.close.emit();
  }

  getLink(result: { type: string; item: any }): string[] {
    switch (result.type) {
      case 'solution': return ['/solutions', result.item.slug];
      case 'product': return ['/products', result.item.slug];
      case 'blog': return ['/blog', result.item.slug];
      case 'project': return ['/projects', result.item.slug];
      case 'venture': return ['/ventures']; // Point to main page for now
      case 'page': return ['/', result.item.slug];
      default: return ['/'];
    }
  }

  getTitle(result: { type: string; item: any }): string {
    if (result.type === 'solution') return (result.item as Solution).sections[0].titleKey;
    if (result.type === 'blog') return (result.item as BlogPost).key + '.TITLE';
    if (result.type === 'page') return (result.item as StaticPage).key;
    if (result.type === 'venture') return (result.item as Venture).name;
    // Fallback for others using key convention
    return result.item.key + '.TITLE';
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: Event) {
    this.closeOverlay();
  }
}
