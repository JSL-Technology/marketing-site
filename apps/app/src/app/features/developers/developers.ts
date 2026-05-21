import { Component, Inject, OnDestroy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { CodeBlockComponent } from '@shared/components/code-block/code-block';
import { CtaComponent } from '@shared/components/cta/cta';
import { RouterLink } from '@angular/router';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-developers',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, CodeBlockComponent, CtaComponent, RouterLink, AnimateOnScroll],
  templateUrl: './developers.html',
  styleUrl: './developers.scss'
})
export class Developers implements OnDestroy {
  currentLang: string;
  private langSub: Subscription;

  quickstartCode = `import { VirtexClient } from '@virtex/sdk';

const client = new VirtexClient({ apiKey: 'vtx_live_51M...' });

// Create an invoice
const invoice = await client.invoices.create({
  customer: 'cus_123',
  amount: 2500,
  currency: 'usd',
  items: [{ description: 'Consulting Services', quantity: 5 }],
});

console.log(invoice.id); // inv_98765`.trim();

  authCode = `// Bearer token authentication
const response = await fetch('https://api.virtex.com/v1/invoices', {
  headers: {
    'Authorization': 'Bearer vtx_live_51M...',
    'Content-Type': 'application/json',
  },
});`.trim();

  webhookCode = `// Handle incoming webhooks
app.post('/webhooks/virtex', (req, res) => {
  const event = VirtexClient.constructEvent(
    req.body,
    req.headers['virtex-signature'],
    process.env.WEBHOOK_SECRET
  );

  switch (event.type) {
    case 'invoice.paid':
      console.log('Invoice paid:', event.data.id);
      break;
    case 'customer.created':
      syncToYourCRM(event.data);
      break;
  }
  res.sendStatus(200);
});`.trim();

  sdks = [
    { name: 'JavaScript / Node.js', icon: 'Code',      pkg: '@virtex/sdk',           install: 'npm install @virtex/sdk'     },
    { name: 'Python',               icon: 'Code',      pkg: 'virtex-python',         install: 'pip install virtex'          },
    { name: '.NET / C#',            icon: 'Code',      pkg: 'Virtex.NET',            install: 'dotnet add package Virtex'   },
    { name: 'Java',                 icon: 'Code',      pkg: 'io.virtex:virtex-java', install: 'maven: io.virtex:virtex-java'},
  ];

  endpoints = [
    { method: 'GET',    path: '/v1/invoices',            desc: 'DEVELOPERS.EP_LIST_INVOICES'   },
    { method: 'POST',   path: '/v1/invoices',            desc: 'DEVELOPERS.EP_CREATE_INVOICE'  },
    { method: 'GET',    path: '/v1/customers',           desc: 'DEVELOPERS.EP_LIST_CUSTOMERS'  },
    { method: 'POST',   path: '/v1/customers',           desc: 'DEVELOPERS.EP_CREATE_CUSTOMER' },
    { method: 'GET',    path: '/v1/products',            desc: 'DEVELOPERS.EP_LIST_PRODUCTS'   },
    { method: 'DELETE', path: '/v1/invoices/{id}',       desc: 'DEVELOPERS.EP_DELETE_INVOICE'  },
  ];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
