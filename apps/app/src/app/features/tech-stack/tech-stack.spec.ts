import { provideHttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '../../core/constants/icons';
import { importProvidersFrom } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechStack } from './tech-stack';

describe('TechStack', () => {
  let component: TechStack;
  let fixture: ComponentFixture<TechStack>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        importProvidersFrom(LucideAngularModule.pick(ALL_ICONS)),
        provideTranslateService(),provideZonelessChangeDetection()],
      imports: [TechStack]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechStack);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
