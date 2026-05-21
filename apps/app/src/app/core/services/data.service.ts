// src/app/core/services/data.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Fallback data in case API is not reachable during SSR or development
import {
  SOLUTIONS,
  PRODUCTS,
  PROCESS_STEPS,
  TEAM_MEMBERS,
  TESTIMONIALS,
  PROJECTS,
  BLOG_POSTS,
  TECH_STACK,
  CAREER_POSITIONS,
  FAQ_ITEMS,
  PARTNERS,
  VENTURES
} from '../data/mock-data';

// --- DEFINICIÓN DE INTERFACES PARA TODO EL SITIO ---

// Interface para Ventures
export interface Venture {
  key: string;
  slug: string;
  name: string;
  descriptionKey: string;
  logoUrl: string;
  status: 'Incubate' | 'Accelerate' | 'Scale';
  website: string;
}

// Interface para Soluciones
export interface Solution {
  key: string;
  slug: string;
  icon: string;
  heroImage: string;
  sections: {
    titleKey: string;
    contentKey: string;
  }[];
  technologies: string[];
}

// Interface para Productos
export interface Product {
  key: string;
  slug: string;
  icon: string;
  type?: string;
  imageUrl?: string;
  externalUrl?: string;
  featuresKeys?: string[];
}

// Interface para Casos de Éxito (Proyectos)
export interface Project {
  key: string;
  slug: string;
  imageUrl: string;
  metrics?: string[];
  category: string;
}

// Interface para Artículos del Blog
export interface BlogPost {
  key: string;
  slug: string;
  imageUrl: string;
  date: string;
  authorKey: string;
  tags: string[];
  readTime: number;
  featured?: boolean;
}

// Interface para Miembros del Equipo
export interface TeamMember {
  key: string;
  nameKey: string;
  roleKey: string;
  bioKey?: string;
  imageUrl: string;
  linkedIn?: string;
  twitter?: string;
  certifications?: string[];
}

// Interface para Testimonios
export interface Testimonial {
  key: string;
  textKey: string;
  nameKey: string;
  roleKey: string;
  imageUrl: string;
}

// Interface para Pasos del Proceso
export interface ProcessStep {
  key: string;
  icon: string;
}

// Interface para una Tecnología individual
export interface Technology {
  name: string;
  imageUrl: string;
}

// Interface para una Categoría del Stack Tecnológico
export interface TechCategory {
  key: string;
  icon: string;
  technologies: Technology[];
}

// Interface para Partners
export interface Partner {
  name: string;
  imageUrl: string;
}

// Interface para Posiciones de Carrera
export interface CareerPosition {
  key: string;
  locationKey: string;
  typeKey: string;
  postedDate?: string;
}

// Interface para Items de FAQ
export interface FaqItem {
  questionKey: string;
  answerKey: string;
  category?: string;
}

// Interface para Páginas Estáticas
export interface StaticPage {
  key: string;
  slug: string;
}

const STATIC_PAGES: StaticPage[] = [
  { key: 'DEVELOPERS.TITLE', slug: 'developers' },
  { key: 'ROADMAP.TITLE', slug: 'roadmap' },
  { key: 'EVENTS.TITLE', slug: 'events' },
  { key: 'STATUS.TITLE', slug: 'status' },
  { key: 'LIFE_AT_JSL.TITLE', slug: 'life-at-jsl' },
  { key: 'PRESS.TITLE', slug: 'press' },
  { key: 'PRICING.TITLE', slug: 'pricing' },
  { key: 'SECURITY_CENTER.TITLE', slug: 'security' },
  { key: 'HEADER.VENTURES', slug: 'ventures' },
  { key: 'HEADER.INVESTORS', slug: 'investors' }
];

/**
 * Servicio centralizado para proveer toda la data (mock) de la aplicación.
 */
@Injectable({
  providedIn: 'root',
})
export class DataService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isServer = isPlatformServer(this.platformId);
  private apiUrl = '/api/data';

  // --- Métodos de Ventures ---
  getVentures(): Observable<Venture[]> {
    if (this.isServer) return of(VENTURES);
    return this.http.get<Venture[]>(`${this.apiUrl}/ventures`).pipe(
      catchError(() => of(VENTURES))
    );
  }

  // --- Métodos de Soluciones ---
  getSolutions(): Observable<Solution[]> {
    if (this.isServer) return of(SOLUTIONS);
    return this.http.get<Solution[]>(`${this.apiUrl}/solutions`).pipe(
      catchError(() => of(SOLUTIONS))
    );
  }

  getSolutionBySlug(slug: string): Observable<Solution | undefined> {
    if (this.isServer) return of(SOLUTIONS.find(s => s.slug === slug));
    return this.http.get<Solution>(`${this.apiUrl}/solutions/${slug}`).pipe(
      catchError(() => of(SOLUTIONS.find(s => s.slug === slug)))
    );
  }

  // --- Métodos de Productos ---
  getProducts(): Observable<Product[]> {
    if (this.isServer) return of(PRODUCTS);
    return this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      catchError(() => of(PRODUCTS))
    );
  }

  getProductBySlug(slug: string): Observable<Product | undefined> {
    return this.getProducts().pipe(map(products => products.find(p => p.slug === slug)));
  }

  // --- Métodos de Proyectos (Casos de Éxito) ---
  getProjects(): Observable<Project[]> {
    if (this.isServer) return of(PROJECTS);
    return this.http.get<Project[]>(`${this.apiUrl}/projects`).pipe(
      catchError(() => of(PROJECTS))
    );
  }

  getProjectBySlug(slug: string): Observable<Project | undefined> {
    return this.getProjects().pipe(map(projects => projects.find(p => p.slug === slug)));
  }

  // --- Métodos de Blog ---
  getBlogPosts(): Observable<BlogPost[]> {
    if (this.isServer) return of(BLOG_POSTS);
    return this.http.get<BlogPost[]>(`${this.apiUrl}/blog`).pipe(
      catchError(() => of(BLOG_POSTS))
    );
  }

  getPostBySlug(slug: string): Observable<BlogPost | undefined> {
    if (this.isServer) return of(BLOG_POSTS.find(p => p.slug === slug));
    return this.http.get<BlogPost>(`${this.apiUrl}/blog/${slug}`).pipe(
      catchError(() => of(BLOG_POSTS.find(p => p.slug === slug)))
    );
  }

  // --- Métodos de Equipo ---
  getTeamMembers(): Observable<TeamMember[]> {
    if (this.isServer) return of(TEAM_MEMBERS);
    return this.http.get<TeamMember[]>(`${this.apiUrl}/team`).pipe(
      catchError(() => of(TEAM_MEMBERS))
    );
  }

  getTeamMemberByKey(key: string): Observable<TeamMember | undefined> {
    return this.getTeamMembers().pipe(map(members => members.find(m => m.key === key)));
  }

  // --- Métodos de Testimonios ---
  getTestimonials(): Observable<Testimonial[]> {
    if (this.isServer) return of(TESTIMONIALS);
    return this.http.get<Testimonial[]>(`${this.apiUrl}/testimonials`).pipe(
      catchError(() => of(TESTIMONIALS))
    );
  }

  // --- Métodos de Proceso ---
  getProcessSteps(): Observable<ProcessStep[]> {
    return of(PROCESS_STEPS);
  }

  // --- Métodos de Stack Tecnológico ---
  getTechStack(): Observable<TechCategory[]> {
    if (this.isServer) return of(TECH_STACK);
    return this.http.get<TechCategory[]>(`${this.apiUrl}/tech-stack`).pipe(
      catchError(() => of(TECH_STACK))
    );
  }

  // --- Métodos de Partners ---
  getPartners(): Observable<Partner[]> {
    return of(PARTNERS);
  }

  // --- Métodos de Carreras ---
  getCareersPositions(): Observable<CareerPosition[]> {
    return of(CAREER_POSITIONS);
  }

  // --- Métodos de FAQ ---
  getFaqItems(): Observable<FaqItem[]> {
    return of(FAQ_ITEMS);
  }

  // --- Método para posts relacionados ---
  getRelatedPosts(currentSlug: string, tags: string[]): Observable<BlogPost[]> {
    if (this.isServer) {
      return of(BLOG_POSTS.filter(
        post => post.slug !== currentSlug && post.tags.some(tag => tags.includes(tag))
      ).slice(0, 3));
    }
    return this.http.get<BlogPost[]>(`${this.apiUrl}/related-posts`, {
      params: { slug: currentSlug, tags: tags.join(',') }
    }).pipe(
      catchError(() => of(BLOG_POSTS.filter(
        post => post.slug !== currentSlug && post.tags.some(tag => tags.includes(tag))
      ).slice(0, 3)))
    );
  }

  // --- Método de Búsqueda Global ---
  search(query: string): Observable<{ type: string; item: any }[]> {
    const q = query.toLowerCase();
    const results: { type: string; item: any }[] = [];

    // Search in Ventures
    VENTURES.forEach(v => {
      if (v.name.toLowerCase().includes(q) || v.slug.includes(q)) {
        results.push({ type: 'venture', item: v });
      }
    });

    // Search in Solutions
    SOLUTIONS.forEach(s => {
      if (s.slug.includes(q) || s.key.toLowerCase().includes(q)) {
        results.push({ type: 'solution', item: s });
      }
    });

    // Search in Products
    PRODUCTS.forEach(p => {
      if (p.slug.includes(q) || p.key.toLowerCase().includes(q)) {
        results.push({ type: 'product', item: p });
      }
    });

    // Search in Blog
    BLOG_POSTS.forEach(b => {
      if (b.slug.includes(q) || b.key.toLowerCase().includes(q) || b.tags.some(t => t.toLowerCase().includes(q))) {
        results.push({ type: 'blog', item: b });
      }
    });

    // Search in Projects
    PROJECTS.forEach(p => {
      if (p.slug.includes(q) || p.key.toLowerCase().includes(q)) {
        results.push({ type: 'project', item: p });
      }
    });

    // Search in Static Pages
    STATIC_PAGES.forEach(p => {
      if (p.slug.includes(q) || p.key.toLowerCase().includes(q)) {
        results.push({ type: 'page', item: p });
      }
    });

    return of(results);
  }
}
