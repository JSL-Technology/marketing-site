import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThankYou } from './thank-you';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
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
        LucideAngularModule.pick({ CheckCircle, Home })
      ],
      providers: [
        provideZonelessChangeDetection()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThankYou);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
