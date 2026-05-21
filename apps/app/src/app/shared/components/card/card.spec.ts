import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '../../../core/constants/icons';

import { Card } from './card';

describe('Card', () => {
  let component: Card;
  let fixture: ComponentFixture<Card>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Card],
      providers: [
        provideZonelessChangeDetection(),
        provideTranslateService(),
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick(ALL_ICONS))
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Card);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
