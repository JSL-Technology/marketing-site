import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { languageInitGuard } from './language-init-guard';

describe('languageInitGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => languageInitGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
