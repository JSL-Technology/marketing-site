import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AnalyticsService } from './analytics.service';

// Simulación de una respuesta exitosa de la API
export interface ApiResponse {
  success: boolean;
  message: string;
}

/**
 * Servicio para manejar todas las comunicaciones con un backend (POST, PUT, etc.).
 * Actualmente simula las respuestas de la API.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  private http = inject(HttpClient);
  private analytics = inject(AnalyticsService);
  private platformId = inject(PLATFORM_ID);

  constructor() { }

  /**
   * Envía el formulario de contacto al backend real.
   * Enriches with lead and client identifiers for tracking.
   */
  sendContactForm(formData: any): Observable<ApiResponse> {
    const leadId = this.analytics.getLeadId();
    const clientId = this.analytics.getClientId();

    const payload = {
      ...formData,
      leadId,
      clientId,
      analytics_event_id: formData.analytics_event_id ?? null,
      analytics_lead_id: leadId,
      utm_source: formData.utm_source ?? null,
      utm_medium: formData.utm_medium ?? null,
      utm_campaign: formData.utm_campaign ?? null
    };

    console.log('ApiService: Enviando formulario de contacto...', payload);
    return this.http.post<ApiResponse>('/api/contact', payload);
  }

  /**
   * Suscribe a un newsletter en el backend real.
   */
  subscribeToNewsletter(email: string): Observable<ApiResponse> {
    const leadId = this.analytics.getLeadId();
    const clientId = this.analytics.getClientId();

    console.log('ApiService: Suscribiendo al newsletter...', email);
    return this.http.post<ApiResponse>('/api/newsletter', {
      email,
      leadId,
      clientId
    });
  }
}
