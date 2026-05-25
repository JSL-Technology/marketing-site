import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { ContactDto } from './contact.dto';

// SEG-01: Escape HTML special characters to prevent XSS in email templates.
function escapeHtml(str: string | null | undefined): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// SEG-12: Mask email address in logs to avoid PII in plaintext log output.
function maskEmail(email: string | null | undefined): string {
  if (!email) return '***';
  const atIdx = email.indexOf('@');
  if (atIdx <= 0) return '***';
  return `***@${email.slice(atIdx + 1)}`;
}

export interface LeadScore {
  score: number;
  tier: 'hot' | 'warm' | 'cold';
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService
  ) {}

  async handleContactForm(formData: ContactDto) {
    this.logger.log(`Receiving contact form: ${maskEmail(formData.email)}`);

    if (formData.honeypot) {
      this.logger.warn(`Potential bot submission detected: ${maskEmail(formData.email)}`);
      return { success: true, message: 'Message received successfully' };
    }

    const isRecaptchaValid = await this.verifyRecaptcha(formData.recaptchaToken);
    if (!isRecaptchaValid) {
      this.logger.warn(`reCAPTCHA validation failed for: ${maskEmail(formData.email)}`);
      return { success: false, message: 'Captcha verification failed' };
    }

    const leadScore = this.calculateLeadScore(formData);

    try {
      await this.mailService.sendContactEmail(formData);

      await this.addBrevoContact(
        formData.email,
        {
          FIRSTNAME: formData.name,
          SOURCE: 'contact_form',
          SERVICE: formData.service,
          ...(formData.segment   && { SEGMENT:   formData.segment   }),
          ...(formData.company   && { COMPANY:   formData.company   }),
          ...(formData.budget    && { BUDGET:    formData.budget    }),
          ...(formData.leadId    && { LEAD_ID:   formData.leadId    }),
          ...(formData.clientId  && { CLIENT_ID: formData.clientId  }),
          ...(formData.utm_source   && { FIRST_TOUCH_SOURCE:   formData.utm_source   }),
          ...(formData.utm_medium   && { FIRST_TOUCH_MEDIUM:   formData.utm_medium   }),
          ...(formData.utm_campaign && { FIRST_TOUCH_CAMPAIGN: formData.utm_campaign }),
          LEAD_SCORE: String(leadScore.score),
          LEAD_TIER:  leadScore.tier,
        },
        this.resolveListIds(formData, leadScore),
      );

      if (leadScore.tier === 'hot') {
        await this.sendSalesAlert(formData, leadScore);
      }

      return { success: true, message: 'Message received and email sent successfully' };
    } catch (error) {
      this.logger.error('Failed to send contact email', error);
      return { success: false, message: 'Message received but failed to notify team' };
    }
  }

  async handleNewsletterSubscription(email: string) {
    this.logger.log(`New newsletter subscription: ${maskEmail(email)}`);
    const whitepaperListId = this.configService.get<string>('BREVO_LIST_WHITEPAPER_ID');
    const ids = whitepaperListId ? [Number(whitepaperListId)] : [];
    await this.addBrevoContact(
      email,
      { SOURCE: 'newsletter', WHITEPAPER_DOWNLOADED: 'true' },
      ids,
    );
    return { success: true, message: 'Subscribed successfully' };
  }

  // --- Lead Scoring ---

  calculateLeadScore(formData: ContactDto): LeadScore {
    let score = 0;

    // Segment scoring
    const segmentPoints: Record<string, number> = {
      enterprise:     30,
      startup:        20,
      'small-business': 10,
      investor:       15,
    };
    score += segmentPoints[formData.segment ?? ''] ?? 0;

    // Service scoring
    const servicePoints: Record<string, number> = {
      erp:         25,
      ai_ml:       20,
      web_dev:     15,
      mobile_dev:  15,
      desktop_dev: 10,
    };
    score += servicePoints[formData.service ?? ''] ?? 5;

    // Budget scoring
    const budgetPoints: Record<string, number> = {
      '>100k':   30,
      '50k-100k': 25,
      '25k-50k':  15,
      '10k-25k':  10,
      '<10k':      5,
    };
    score += budgetPoints[formData.budget ?? ''] ?? 0;

    // Bonus signals
    if (formData.company && formData.company.trim().length > 0) score += 15;
    if (formData.phone   && formData.phone.trim().length > 0)   score += 10;
    if (formData.utm_source === 'linkedin')                     score += 10;

    const tier: 'hot' | 'warm' | 'cold' =
      score >= 60 ? 'hot' :
      score >= 30 ? 'warm' :
      'cold';

    this.logger.log(`[LeadScore] ${maskEmail(formData.email)}: score=${score} tier=${tier}`);
    return { score, tier };
  }

  private resolveListIds(formData: ContactDto, leadScore: LeadScore): number[] {
    const ids: number[] = [];

    const baseId     = this.configService.get<string>('BREVO_LIST_ID');
    const contactId  = this.configService.get<string>('BREVO_LIST_CONTACT_ID');
    const enterpriseId = this.configService.get<string>('BREVO_LIST_ENTERPRISE_ID');

    if (baseId)      ids.push(Number(baseId));
    if (contactId)   ids.push(Number(contactId));
    if (enterpriseId && (formData.segment === 'enterprise' || leadScore.tier === 'hot')) {
      ids.push(Number(enterpriseId));
    }

    return ids.filter(id => !isNaN(id) && id > 0);
  }

  private async sendSalesAlert(formData: ContactDto, leadScore: LeadScore): Promise<void> {
    const apiKey      = this.configService.get<string>('BREVO_API_KEY');
    const alertEmail  = this.configService.get<string>('SALES_ALERT_EMAIL');
    if (!apiKey || !alertEmail) return;

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          sender:  { name: 'JSL CRM', email: 'noreply@jsl.technology' },
          to:      [{ email: alertEmail }],
          subject: `🔥 Hot Lead: ${escapeHtml(formData.name)} (${escapeHtml(formData.company ?? 'No company')}) — Score ${leadScore.score}`,
          htmlContent: `
            <h2>New hot lead received</h2>
            <p><strong>Name:</strong> ${escapeHtml(formData.name)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(formData.email)}">${escapeHtml(formData.email)}</a></p>
            <p><strong>Company:</strong> ${escapeHtml(formData.company) || '—'}</p>
            <p><strong>Service:</strong> ${escapeHtml(formData.service)}</p>
            <p><strong>Budget:</strong> ${escapeHtml(formData.budget) || '—'}</p>
            <p><strong>Segment:</strong> ${escapeHtml(formData.segment) || '—'}</p>
            <p><strong>Phone:</strong> ${escapeHtml(formData.phone) || '—'}</p>
            <p><strong>Source:</strong> ${escapeHtml(formData.utm_source) || 'direct'}</p>
            <p><strong>Lead Score:</strong> ${leadScore.score} / 100 (${leadScore.tier.toUpperCase()})</p>
            <hr>
            <p><strong>Message:</strong><br>${escapeHtml(formData.message)}</p>
            <p style="margin-top:16px;color:#888;font-size:12px;">Lead ID: ${escapeHtml(formData.leadId) || '—'} · Client ID: ${escapeHtml(formData.clientId) || '—'}</p>
          `,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`[SalesAlert] Non-OK ${response.status}: ${body}`);
      } else {
        this.logger.log(`[SalesAlert] Sent to ${alertEmail}`);
      }
    } catch (error) {
      this.logger.error('[SalesAlert] Failed to send alert', error);
    }
  }

  private async verifyRecaptcha(token: string): Promise<boolean> {
    const secret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    if (!secret || !token) return false;
    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token })
      });
      const data = await response.json() as { success?: boolean; score?: number; action?: string };
      return Boolean(data.success) && (data.score ?? 0) >= 0.5 && data.action === 'contact_form_submit';
    } catch (error) {
      this.logger.error('Failed to verify reCAPTCHA token', error as Error);
      return false;
    }
  }

  private async addBrevoContact(
    email: string,
    attributes: Record<string, string>,
    listIds: number[] = [],
  ): Promise<void> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      this.logger.warn('[Brevo] BREVO_API_KEY not configured — lead not synced to ESP.');
      return;
    }

    const ids = listIds.length > 0 ? listIds : (() => {
      const brevoListId = this.configService.get<string>('BREVO_LIST_ID');
      return brevoListId ? [Number(brevoListId)] : [];
    })();

    try {
      const response = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          email,
          attributes,
          ...(ids.length > 0 && { listIds: ids }),
          updateEnabled: true,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`[Brevo] Non-OK response ${response.status}: ${body}`);
      } else {
        this.logger.log(`[Brevo] Contact synced: ${maskEmail(email)}`);
      }
    } catch (error) {
      this.logger.error('[Brevo] Failed to sync contact', error);
    }
  }
}
