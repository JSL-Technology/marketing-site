import { TestBed } from '@angular/core/testing';
import { GestureBusService, GestureHandler } from './gesture-bus.service';
import { AnalyticsService } from './analytics.service';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';

describe('GestureBusService', () => {
  let service: GestureBusService;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;

  beforeEach(() => {
    analyticsServiceSpy = jasmine.createSpyObj('AnalyticsService', ['trackEvent']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        GestureBusService,
        { provide: AnalyticsService, useValue: analyticsServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(GestureBusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should arbitrate between handlers based on priority', () => {
    const handler1: GestureHandler = {
      name: 'LowPriority',
      priority: 10,
      onPointerDown: jasmine.createSpy('onPointerDown1').and.returnValue(true)
    };
    const handler2: GestureHandler = {
      name: 'HighPriority',
      priority: 100,
      onPointerDown: jasmine.createSpy('onPointerDown2').and.returnValue(true)
    };

    service.registerHandler(handler1);
    service.registerHandler(handler2);

    const event = new PointerEvent('pointerdown');
    (service as any).handlePointerDown(event);

    expect(handler2.onPointerDown).toHaveBeenCalledWith(event);
    expect(handler1.onPointerDown).not.toHaveBeenCalled();
  });

  it('should notify and cancel previous handler when a new handler captures the gesture', () => {
    const handler1: GestureHandler = {
      name: 'Handler1',
      priority: 10,
      onPointerDown: jasmine.createSpy('onPointerDown1').and.returnValue(true),
      onPointerCancel: jasmine.createSpy('onPointerCancel1')
    };
    const handler2: GestureHandler = {
      name: 'Handler2',
      priority: 100,
      onPointerDown: jasmine.createSpy('onPointerDown2').and.returnValue(true)
    };

    service.registerHandler(handler1);

    // Initial capture by handler1
    (service as any).handlePointerDown(new PointerEvent('pointerdown'));
    expect(service['activeHandler']).toBe(handler1);

    // Register handler2 (higher priority)
    service.registerHandler(handler2);

    // Second pointerdown, handler2 should steal it
    const event2 = new PointerEvent('pointerdown');
    (service as any).handlePointerDown(event2);

    expect(service['activeHandler']).toBe(handler2);
    expect(handler1.onPointerCancel).toHaveBeenCalled();
    expect(analyticsServiceSpy.trackEvent).toHaveBeenCalledWith('gesture_ownership_change', jasmine.objectContaining({
      from: 'Handler1',
      to: 'Handler2'
    }));
  });
});
