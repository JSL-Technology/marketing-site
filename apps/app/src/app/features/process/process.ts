import { Component, Inject, OnDestroy, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { CtaComponent } from '@shared/components/cta/cta';
import { DataService } from '@core/services/data.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-process',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, AnimateOnScroll, CtaComponent],
  templateUrl: './process.html',
  styleUrl: './process.scss'
})
export class Process implements OnDestroy {
  private dataService = inject(DataService);
  private langSub: Subscription;

  public processSteps = toSignal(this.dataService.getProcessSteps(), { initialValue: [] });

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.langSub = this.translate.onLangChange.subscribe(() => {});
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
