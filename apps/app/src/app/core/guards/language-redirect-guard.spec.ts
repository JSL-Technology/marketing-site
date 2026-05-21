import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';

import { LanguageRedirectService } from './language-redirect-guard';

describe('LanguageRedirectService', () => {
  const createState = (url: string) => ({ url } as RouterStateSnapshot);

  it('returns UrlTree with default language on server', () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        LanguageRedirectService,
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: CookieService, useValue: { get: () => '' } },
        { provide: TranslateService, useValue: { getLangs: () => ['en', 'es'], getBrowserLang: () => 'es' } },
      ],
    });

    const service = TestBed.inject(LanguageRedirectService);
    const tree = service.redirect(createState('/solutions/web-development'));
    expect(tree.toString()).toBe('/en/solutions/web-development');
  });

  it('does not duplicate language in URL', () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        LanguageRedirectService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: CookieService, useValue: { get: () => 'es' } },
        { provide: TranslateService, useValue: { getLangs: () => ['en', 'es'], getBrowserLang: () => 'es' } },
      ],
    });

    const service = TestBed.inject(LanguageRedirectService);
    const tree = service.redirect(createState('/en/solutions/web-development'));
    expect(tree.toString()).toBe('/en/solutions/web-development');
  });
});
