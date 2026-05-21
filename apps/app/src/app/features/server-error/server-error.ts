import { Component, Inject, OnDestroy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, RouterLink],
  templateUrl: './server-error.html',
  styleUrls: ['./server-error.scss']
})
export class ServerError implements OnDestroy {
  currentLang: string;
  private langSub: Subscription;

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }

  reload() { window.location.reload(); }
}
