import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VirteexLanding } from './virteex-landing';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { ALL_ICONS } from '@core/constants/icons';

describe('VirteexLanding', () => {
  let component: VirteexLanding;
  let fixture: ComponentFixture<VirteexLanding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        VirteexLanding,
        TranslateModule.forRoot(),
        LucideAngularModule.pick(ALL_ICONS)
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VirteexLanding);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
