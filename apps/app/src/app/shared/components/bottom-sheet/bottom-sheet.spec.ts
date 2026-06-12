import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ALL_ICONS } from '../../../core/constants/icons';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomSheetComponent } from './bottom-sheet';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LucideAngularModule, X } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';
import { GestureBusService } from '@core/services/gesture-bus.service';

describe('BottomSheetComponent', () => {
  let component: BottomSheetComponent;
  let fixture: ComponentFixture<BottomSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomSheetComponent,
        NoopAnimationsModule,
        ,
        TranslateModule.forRoot()],
      providers: [
        importProvidersFrom(LucideAngularModule.pick(ALL_ICONS)),
        GestureBusService,
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be closed by default', () => {
    expect(component.isOpen).toBeFalse();
    expect(component.translateY).toBe(100);
    expect(component.overlayOpacity).toBe(0);
  });

  it('should update state when isOpen changes', (done) => {
    component.isOpen = true;
    component.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    fixture.detectChanges();

    // The animation starts in the next frame
    requestAnimationFrame(() => {
      fixture.detectChanges();
      expect(component.translateY).toBe(0);
      expect(component.overlayOpacity).toBe(1);
      done();
    });
  });

  it('should emit close event when onClose is called', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });
});