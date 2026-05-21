import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '@core/constants/icons';
import { SUPPORTED_LANGUAGES } from '@core/constants/languages';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, LucideAngularModule],
  templateUrl: './breadcrumbs.html',
  styleUrls: ['./breadcrumbs.scss']
})
export class BreadcrumbsComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];
  readonly icons = ALL_ICONS;
  private supportedLanguages = SUPPORTED_LANGUAGES;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      distinctUntilChanged()
    ).subscribe(() => {
      this.generateBreadcrumbs();
    });

    // Build initial
    this.generateBreadcrumbs();
  }

  private generateBreadcrumbs() {
    this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);

    // Hide breadcrumbs on Home page to avoid redundancy
    if (this.breadcrumbs.length > 0) {
      const last = this.breadcrumbs[this.breadcrumbs.length - 1];
      if (last.label === 'HEADER.HOME') {
        this.breadcrumbs = [];
      }
    }
  }

  private buildBreadcrumbs(route: ActivatedRoute, url = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');

      // Skip language segments
      if (this.supportedLanguages.includes(routeURL)) {
        return this.buildBreadcrumbs(child, `/${routeURL}`, breadcrumbs);
      }

      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      let label = child.snapshot.data['title'] || routeURL;

      // If title is dynamic, we try to format the slug or wait for more data
      if (label === 'dynamic' || (child.snapshot.url.length > 0 && child.snapshot.routeConfig?.path?.startsWith(':'))) {
        const lastSegment = child.snapshot.url[child.snapshot.url.length - 1]?.path;
        if (lastSegment) {
          label = lastSegment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }

      const existing = breadcrumbs.find(b => b.url === url);

      if (!existing && label && label !== 'dynamic') {
        breadcrumbs.push({ label, url });
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
