import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '@core/constants/icons';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-social-share',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslateModule],
  templateUrl: './social-share.html',
  styleUrls: ['./social-share.scss']
})
export class SocialShareComponent {
  @Input() url = '';
  @Input() title = '';
  @Input() description = '';
  @Output() close = new EventEmitter<void>();

  readonly icons = ALL_ICONS;
  public copied = signal(false);

  get shareUrl(): string {
    if (typeof window !== 'undefined' && !this.url.startsWith('http')) {
      return window.location.origin + this.url;
    }
    return this.url;
  }

  share(platform: 'linkedin' | 'facebook' | 'pinterest' | 'reddit' | 'whatsapp' | 'messages' | 'mail'): void {
    const url = encodeURIComponent(this.shareUrl);
    const text = encodeURIComponent(this.title);

    let shareLink = '';

    switch (platform) {
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'pinterest':
        shareLink = `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`;
        break;
      case 'reddit':
        shareLink = `https://www.reddit.com/submit?url=${url}&title=${text}`;
        break;
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        break;
      case 'messages':
        // sms:?&body= on iOS, sms:?body= on Android. & works for both usually.
        shareLink = `sms:?&body=${text}%20${url}`;
        break;
      case 'mail':
        shareLink = `mailto:?subject=${text}&body=${url}`;
        break;
    }

    if (shareLink && typeof window !== 'undefined') {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  }

  copyLink(): void {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(this.shareUrl).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
