import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { languageInitGuard } from './language-init-guard';

describe('languageInitGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => languageInitGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService(), provideZonelessChangeDetection()],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
