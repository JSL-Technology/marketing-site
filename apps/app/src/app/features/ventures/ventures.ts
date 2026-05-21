import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { DataService, Venture } from '@core/services/data.service';
import { Observable } from 'rxjs';
import { CtaComponent } from '@shared/components/cta/cta';

@Component({
  selector: 'jsl-ventures',
  standalone: true,
  imports: [CommonModule, TranslateModule, LucideAngularModule, CtaComponent],
  templateUrl: './ventures.html',
  styleUrl: './ventures.scss'
})
export class Ventures implements OnInit {
  ventures$: Observable<Venture[]>;

  constructor(private dataService: DataService) {
    this.ventures$ = this.dataService.getVentures();
  }

  ngOnInit(): void {}
}
