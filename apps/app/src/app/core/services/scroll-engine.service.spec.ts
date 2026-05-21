import { TestBed } from '@angular/core/testing';
import { ScrollEngineService } from './scroll-engine.service';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';

describe('ScrollEngineService', () => {
  let service: ScrollEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ScrollEngineService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ScrollEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit ready when Lenis is set', (done) => {
    const mockLenis = {} as any;
    service.isReady$().subscribe(ready => {
      if (ready) {
        expect(ready).toBeTrue();
        done();
      }
    });
    service.setLenis(mockLenis);
  });
});
