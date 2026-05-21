import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CtaComponent } from '@shared/components/cta/cta';
import { Seo } from '@core/services/seo';

interface EventItem {
  title: string;
  startDate: string;
  endDate?: string;
  description: string;
  image: string;
  registrationUrl?: string;
  isOnline?: boolean;
}

@Component({
  selector: 'jsl-events',
  standalone: true,
  imports: [CommonModule, TranslateModule, CtaComponent],
  templateUrl: './events.html',
  styleUrl: './events.scss'
})
export class Events implements OnInit {
  private seo = inject(Seo);

  upcomingEvents: EventItem[] = [
    {
      title: 'virtex ERP 2.0 Demo',
      startDate: '2025-11-15T14:00:00-05:00',
      endDate: '2025-11-15T15:30:00-05:00',
      description: 'See the new features of our flagship ERP system in action. Live walkthrough with Q&A session.',
      image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800',
      registrationUrl: 'https://www.jsl.technology/en/events',
      isOnline: true,
    },
    {
      title: 'Cloud Security Masterclass',
      startDate: '2025-12-05T11:00:00-05:00',
      endDate: '2025-12-05T13:00:00-05:00',
      description: 'Best practices for securing your infrastructure on AWS and Azure. Hands-on lab included.',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
      registrationUrl: 'https://www.jsl.technology/en/events',
      isOnline: true,
    }
  ];

  pastEvents = [
    {
      title: 'Scaling Node.js Microservices',
      date: 'Oct 10, 2025',
      image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800'
    }
  ];

  ngOnInit(): void {
    this.injectEventSchemas();
  }

  private injectEventSchemas(): void {
    this.upcomingEvents.forEach((event, index) => {
      this.seo.setEventSchema(
        {
          name: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          image: event.image,
          organizerName: 'JSL Technology',
          locationName: event.isOnline ? 'Online — JSL Technology Webinar' : 'Santo Domingo, Dominican Republic',
          locationUrl: event.isOnline ? (event.registrationUrl ?? 'https://www.jsl.technology') : undefined,
          eventStatus: 'EventScheduled',
          eventAttendanceMode: event.isOnline ? 'OnlineEventAttendanceMode' : 'OfflineEventAttendanceMode',
          url: event.registrationUrl,
        },
        `event-schema-${index}`,
      );
    });
  }

  // Helpers for the template
  formatDisplayDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    });
  }
}
