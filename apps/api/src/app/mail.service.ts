import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<number>('SMTP_PORT') === 465, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendContactEmail(contactData: {
    name: string;
    email: string;
    phone?: string;
    service: string;
    message: string;
    company?: string;
    budget?: string;
    segment?: string;
  }) {
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@jsltechnology.com',
      to: this.configService.get<string>('CONTACT_RECEIVER_EMAIL'),
      subject: `New Contact Form Submission: ${contactData.service}`,
      text: `
        You have a new contact form submission:

        Name: ${contactData.name}
        Email: ${contactData.email}
        Phone: ${contactData.phone || 'Not provided'}
        Company: ${contactData.company || 'Not provided'}
        Budget: ${contactData.budget || 'Not provided'}
        Segment: ${contactData.segment || 'unknown'}
        Service of Interest: ${contactData.service}
        Message: ${contactData.message}
      `,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${contactData.name}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
        <p><strong>Company:</strong> ${contactData.company || 'Not provided'}</p>
        <p><strong>Budget:</strong> ${contactData.budget || 'Not provided'}</p>
        <p><strong>Segment:</strong> ${contactData.segment || 'unknown'}</p>
        <p><strong>Service of Interest:</strong> ${contactData.service}</p>
        <p><strong>Message:</strong></p>
        <p>${contactData.message}</p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error('Error sending email', error);
      throw error;
    }
  }
}
