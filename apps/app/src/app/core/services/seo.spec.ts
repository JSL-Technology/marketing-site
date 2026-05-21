import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Seo } from './seo';
import { RouterModule } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { BASE_URL } from '../constants/tokens';

describe('Seo', () => {
  let service: Seo;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        RouterModule.forRoot([])
      ],
      providers: [
        Seo,
        provideZonelessChangeDetection(),
        { provide: BASE_URL, useValue: 'https://www.jsl.technology' }
      ]
    });
    service = TestBed.inject(Seo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
