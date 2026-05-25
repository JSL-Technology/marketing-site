import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './contact.dto';
import { NewsletterDto } from './newsletter.dto';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contact')
  async sendContact(@Body() formData: ContactDto) {
    return this.contactService.handleContactForm(formData);
  }

  @Post('newsletter')
  async subscribeNewsletter(@Body() dto: NewsletterDto) {
    return this.contactService.handleNewsletterSubscription(dto.email);
  }
}
