import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { LucideAngularModule, Layers, Package, Briefcase, BookOpen, Users, Mail, Search, Home } from 'lucide-angular';

import { NotFound } from './not-found';

describe('NotFound', () => {
  let component: NotFound;
  let fixture: ComponentFixture<NotFound>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotFound,
        LucideAngularModule.pick({ Layers, Package, Briefcase, BookOpen, Users, Mail, Search, Home })
      ],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        provideZonelessChangeDetection()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotFound);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
