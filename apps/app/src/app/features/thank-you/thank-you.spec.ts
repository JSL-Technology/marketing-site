import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ALL_ICONS } from '../../core/constants/icons';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThankYou } from './thank-you';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

import { LucideAngularModule, CheckCircle, Home } from 'lucide-angular';

describe('ThankYou', () => {
  let component: ThankYou;
  let fixture: ComponentFixture<ThankYou>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ThankYou,
        TranslateModule.forRoot(),
        RouterModule.forRoot([]),
        LucideAngularModule.pick(ALL_ICONS),
      ],
      providers: [
        importProvidersFrom(LucideAngularModule.pick(ALL_ICONS)),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThankYou);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
