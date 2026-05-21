import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'jsl-whatsapp-button',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './whatsapp-button.html',
  styleUrl: './whatsapp-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsAppButtonComponent {
  private readonly translate = inject(TranslateService);
  private readonly whatsappNumber = '18092641693';

  private readonly messageByLanguage: Record<string, string> = {
    en: 'Hi! I would like more information about your services.',
    es: '¡Hola! Me gustaría recibir más información sobre sus servicios.',
    fr: "Bonjour ! J'aimerais recevoir plus d'informations sur vos services.",
    de: 'Hallo! Ich möchte gerne mehr Informationen über Ihre Dienstleistungen erhalten.',
    it: 'Ciao! Vorrei ricevere maggiori informazioni sui vostri servizi.',
    pt: 'Olá! Gostaria de receber mais informações sobre os seus serviços.',
    ja: 'こんにちは。サービスについて詳しい情報をいただけますか？',
    ko: '안녕하세요! 서비스에 대한 더 많은 정보를 받고 싶습니다.',
    zh: '您好！我想了解更多关于你们服务的信息。',
    ar: 'مرحبًا! أود الحصول على مزيد من المعلومات حول خدماتكم.',
    ht: 'Bonjou! Mwen ta renmen resevwa plis enfòmasyon sou sèvis nou yo.',
  };

  get whatsappLink(): string {
    const currentLanguage = this.translate.currentLang || this.translate.defaultLang || 'en';
    const languageKey = currentLanguage.toLowerCase().split('-')[0];
    const message = this.messageByLanguage[languageKey] ?? this.messageByLanguage.en;
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }
}
