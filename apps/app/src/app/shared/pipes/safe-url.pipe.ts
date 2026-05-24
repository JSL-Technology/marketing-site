import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const ALLOWED_HOSTS = new Set([
  'www.youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'calendly.com',
  'www.calendly.com',
]);

@Pipe({ name: 'safeUrl', standalone: true })
export class SafeUrlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(url: string): SafeResourceUrl {
    try {
      if (!url || url.trim() === '') {
        return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
      }
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
        console.warn(`SafeUrlPipe: domain not in allowlist — ${parsed.hostname}`);
        return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
      }
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } catch {
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }
  }
}
