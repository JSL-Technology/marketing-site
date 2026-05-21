import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AboutUs } from './about-us';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '@core/constants/icons';

describe('AboutUs', () => {
  let component: AboutUs;
  let fixture: ComponentFixture<AboutUs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUs, LucideAngularModule.pick(ALL_ICONS)],
      providers: [
        provideZonelessChangeDetection(),
        provideTranslateService(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutUs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
