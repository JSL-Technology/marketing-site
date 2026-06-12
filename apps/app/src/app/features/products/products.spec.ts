import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '../../core/constants/icons';
import { importProvidersFrom } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Products } from './products';

describe('Products', () => {
  let component: Products;
  let fixture: ComponentFixture<Products>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick(ALL_ICONS)),
        provideTranslateService(),provideZonelessChangeDetection()],
      imports: [Products]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Products);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
