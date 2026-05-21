import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { CtaComponent } from '@shared/components/cta/cta';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';

interface PressRelease {
  id: number;
  date: string;
  categoryKey: string;
  title: string;
  excerpt: string;
  url: string;
}

interface MediaMention {
  id: number;
  outlet: string;
  category: string;
  title: string;
  date: string;
  url: string;
  featured: boolean;
}

interface PressAsset {
  name: string;
  description: string;
  type: string;
  size: string;
  icon: string;
}

interface PressStat {
  valueKey: string;
  labelKey: string;
  icon: string;
}

@Component({
  selector: 'jsl-press',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, CtaComponent, AnimateOnScroll],
  templateUrl: './press.html',
  styleUrl: './press.scss'
})
export class Press {
  readonly stats: PressStat[] = [
    { valueKey: 'PRESS.STATS_OUTLETS_VAL',  labelKey: 'PRESS.STATS_OUTLETS',       icon: 'Globe'     },
    { valueKey: 'PRESS.STATS_MENTIONS_VAL', labelKey: 'PRESS.STATS_MENTIONS_LABEL', icon: 'Newspaper' },
    { valueKey: 'PRESS.STATS_COUNTRIES_VAL', labelKey: 'PRESS.STATS_COUNTRIES',     icon: 'MapPin'    },
    { valueKey: 'PRESS.STATS_ARTICLES_VAL', labelKey: 'PRESS.STATS_ARTICLES',       icon: 'FileText'  },
  ];

  readonly pressReleases: PressRelease[] = [
    {
      id: 1,
      date: 'March 15, 2025',
      categoryKey: 'PRESS.CATEGORY_LAUNCH',
      title: 'JSL Technology Launches virtex 3.0 — The Most Advanced Cloud ERP for Modern Enterprises',
      excerpt: 'The new release introduces AI-powered forecasting, real-time inventory sync, and a redesigned mobile-first interface, setting a new benchmark for enterprise software across the Caribbean and Latin America.',
      url: '#'
    },
    {
      id: 2,
      date: 'January 22, 2025',
      categoryKey: 'PRESS.CATEGORY_EXPANSION',
      title: 'JSL Technology Expands to Colombia and Mexico, Targets $5M ARR in 2025',
      excerpt: 'Building on strong growth in the Dominican Republic and Puerto Rico, JSL is accelerating its Latin American expansion with new engineering hubs and regional strategic partnerships.',
      url: '#'
    },
    {
      id: 3,
      date: 'November 10, 2024',
      categoryKey: 'PRESS.CATEGORY_PARTNERSHIP',
      title: 'JSL Technology Achieves AWS Advanced Partner Status to Deliver Cloud Infrastructure at Scale',
      excerpt: 'The AWS Advanced Partner designation strengthens JSL\'s ability to architect, migrate, and manage enterprise-grade cloud infrastructure with enhanced co-selling support and reduced time-to-deploy.',
      url: '#'
    },
    {
      id: 4,
      date: 'September 5, 2024',
      categoryKey: 'PRESS.CATEGORY_AWARD',
      title: 'JSL Technology Named Among Top 25 Software Companies in the Caribbean by TechRadar',
      excerpt: 'Recognition underscores the company\'s rapid growth, engineering excellence, and commitment to building world-class digital products from the Caribbean for global markets.',
      url: '#'
    },
  ];

  readonly mediaMentions: MediaMention[] = [
    {
      id: 1,
      outlet: 'Forbes',
      category: 'Business',
      title: 'Top 10 Nearshore Software Companies Reshaping Latin American Tech',
      date: 'Feb 2025',
      url: '#',
      featured: true
    },
    {
      id: 2,
      outlet: 'TechCrunch',
      category: 'Startups',
      title: 'How Caribbean Startups Are Disrupting the Global ERP Market',
      date: 'Jan 2025',
      url: '#',
      featured: true
    },
    {
      id: 3,
      outlet: 'Inc.',
      category: 'Leadership',
      title: 'The Next Generation of Enterprise Software Leaders',
      date: 'Dec 2024',
      url: '#',
      featured: false
    },
    {
      id: 4,
      outlet: 'Business Insider',
      category: 'Technology',
      title: 'ERP Goes Cloud-Native: How JSL Is Leading the Shift',
      date: 'Nov 2024',
      url: '#',
      featured: false
    },
    {
      id: 5,
      outlet: 'Wired',
      category: 'Innovation',
      title: 'Building the Future of Work from the Caribbean',
      date: 'Oct 2024',
      url: '#',
      featured: true
    },
    {
      id: 6,
      outlet: 'Fast Company',
      category: 'Tech',
      title: 'Most Innovative Enterprise Software Companies of 2024',
      date: 'Sep 2024',
      url: '#',
      featured: false
    },
  ];

  readonly pressAssets: PressAsset[] = [
    {
      name: 'Brand Logo Pack',
      description: 'SVG, PNG, and WEBP — light & dark variants included',
      type: 'ZIP',
      size: '3.2 MB',
      icon: 'Image'
    },
    {
      name: 'Brand Guidelines',
      description: 'Typography, color palette, usage rules, and visual standards',
      type: 'PDF',
      size: '8.4 MB',
      icon: 'FileText'
    },
    {
      name: 'Executive Photos',
      description: 'High-resolution leadership portraits at 300dpi',
      type: 'ZIP',
      size: '24.6 MB',
      icon: 'Users'
    },
    {
      name: 'Company Fact Sheet',
      description: 'Key metrics, founding story, milestones, and corporate overview',
      type: 'PDF',
      size: '1.1 MB',
      icon: 'BookOpen'
    },
    {
      name: 'Product Screenshots',
      description: 'virtex ERP, JSL-POS, and mobile app UI at full resolution',
      type: 'ZIP',
      size: '18.7 MB',
      icon: 'Monitor'
    },
    {
      name: 'Press Release Archive',
      description: 'All press releases from 2023 to present in a single bundle',
      type: 'ZIP',
      size: '5.9 MB',
      icon: 'Archive'
    },
  ];

  readonly outletInitials: Record<string, string> = {
    'Forbes':          'F',
    'TechCrunch':      'TC',
    'Inc.':            'Inc',
    'Business Insider':'BI',
    'Wired':           'W',
    'Fast Company':    'FC',
  };

  getOutletInitial(outlet: string): string {
    return this.outletInitials[outlet] ?? outlet.charAt(0);
  }
}
