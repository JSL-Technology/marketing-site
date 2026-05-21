import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Investors } from './investors';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { ALL_ICONS } from '@core/constants/icons';

describe('Investors', () => {
  let component: Investors;
  let fixture: ComponentFixture<Investors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Investors,
        TranslateModule.forRoot(),
        LucideAngularModule.pick(ALL_ICONS)
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Investors);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
