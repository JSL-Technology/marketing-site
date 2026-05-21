import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'jsl-status',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule],
  templateUrl: './status.html',
  styleUrl: './status.scss'
})
export class Status {
  lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  systems = [
    { name: 'virtex Cloud Platform',      uptime: 99.99, status: 'operational' },
    { name: 'JSL API Gateway',            uptime: 100,   status: 'operational' },
    { name: 'Authentication Service',     uptime: 100,   status: 'operational' },
    { name: 'Website & Documentation',    uptime: 100,   status: 'operational' },
    { name: 'Billing & Invoicing System', uptime: 99.95, status: 'operational' },
    { name: 'Notification Service',       uptime: 99.80, status: 'degraded'    },
  ];

  incidents = [
    {
      date: 'Oct 15, 2024',
      title: 'Scheduled Maintenance — Database Upgrade',
      desc: 'Routine database upgrades were performed successfully. No data loss occurred.',
      status: 'Resolved',
      resolved: true,
      severity: 'info',
    },
    {
      date: 'Sep 3, 2024',
      title: 'Notification Service Latency',
      desc: 'Some users experienced delayed email and push notifications. Root cause identified and fixed.',
      status: 'Resolved',
      resolved: true,
      severity: 'warning',
    },
  ];

  get overallStatus(): string {
    if (this.systems.some(s => s.status === 'outage')) return 'status-outage';
    if (this.systems.some(s => s.status === 'degraded')) return 'status-degraded';
    return 'status-operational';
  }

  get overallIcon(): string {
    if (this.systems.some(s => s.status === 'outage')) return 'X';
    if (this.systems.some(s => s.status === 'degraded')) return 'Clock';
    return 'CheckCircle';
  }

  get overallLabel(): string {
    if (this.systems.some(s => s.status === 'outage')) return 'STATUS.OUTAGE';
    if (this.systems.some(s => s.status === 'degraded')) return 'STATUS.PARTIAL_OUTAGE';
    return 'STATUS.OPERATIONAL';
  }
}
